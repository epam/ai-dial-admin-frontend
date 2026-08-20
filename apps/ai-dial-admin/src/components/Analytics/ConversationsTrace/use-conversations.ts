'use client';

import { ColumnVisibleEvent, GridApi, GridReadyEvent, IDatasource, IGetRowsParams } from 'ag-grid-community';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getConversations } from '@/src/app/[lang]/conversations-trace/actions';
import {
  CONVERSATIONS_SEARCH_DEBOUNCE_MS,
  CONVERSATIONS_TIME_PERIOD,
  CONVERSATION_FIELD_VALUE_TYPE,
} from '@/src/constants/analytics/conversations-trace';
import { CONVERSATIONS_TRACE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useTimeFilter } from '@/src/hooks/use-time-filter';
import { useI18n } from '@/src/locales/client';
import {
  ConversationColumnFilter,
  ConversationFilters,
  ConversationSortKey,
  ConversationRow,
  ConversationSummary,
  ConversationTotals,
  ConversationsPage,
  FeedbackFilter,
} from '@/src/models/analytics/conversations-trace';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import {
  filterableColumnFields,
  projectableSchemaFields,
  sortableColumnFields,
} from '@/src/utils/analytics/conversation-column-catalog';
import {
  ConversationGridFilterModel,
  ConversationModelScope,
  translateConversationFilterModel,
  translateConversationSortModel,
} from '@/src/utils/analytics/conversation-grid-models';
import { summariseConversations } from '@/src/utils/analytics/conversation-rows';
import { getErrorNotification } from '@/src/utils/notification';

const filterKey = ({ search, startMs, endMs, feedback }: ConversationFilters): string =>
  [search, startMs, endMs, feedback].join('|');

// The projection is deliberately not part of the key: revealing a source-backed column changes neither the
// result nor the rows already held, so the loaded set survives it.
const resultKey = (
  filters: ConversationFilters,
  columnFilters: ConversationColumnFilter[],
  sort: ConversationSortKey[],
): string => [filterKey(filters), JSON.stringify(columnFilters), JSON.stringify(sort)].join('|');

interface LoadedConversations {
  key: string;
  byId: Map<string, ConversationRow>;
}

// The ids the first page of a result resolved, held for the rest of that result's pages. It stays in the
// browser: the set is resolved under the caller's token, so a server-side cache keyed on the filter state
// would narrow one caller's result by ids another caller's token selected.
interface CandidateIds {
  key: string;
  ids: string[];
}

export const useConversations = (schemaFields?: AnalyticsEntityField[] | null) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  const [gridApi, setGridApi] = useState<GridApi<ConversationRow> | null>(null);

  const [hasLoadError, setHasLoadError] = useState(false);
  const [totals, setTotals] = useState<ConversationTotals | null>(null);
  const [loaded, setLoaded] = useState<LoadedConversations>({ key: '', byId: new Map() });
  const [isEmptyResult, setIsEmptyResult] = useState(false);
  const [isFirstPageLoading, setIsFirstPageLoading] = useState(true);
  const [isFeedbackCapped, setIsFeedbackCapped] = useState(false);

  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [feedback, setFeedback] = useState(FeedbackFilter.All);

  const { timePeriod, timeRange, onTimePeriodChange, onTimeRangeChange } = useTimeFilter({
    defaultTimeFilter: CONVERSATIONS_TIME_PERIOD,
  });

  const filters: ConversationFilters = useMemo(
    () => ({
      search: appliedSearch,
      startMs: timeRange.startDate.getTime(),
      endMs: timeRange.endDate.getTime(),
      feedback,
    }),
    [appliedSearch, timeRange, feedback],
  );

  const key = filterKey(filters);

  const modelScope: ConversationModelScope = useMemo(() => {
    const curated = CONVERSATIONS_TRACE_COLUMNS(t, schemaFields ?? []);
    return {
      sortableFields: sortableColumnFields(curated),
      filterableFields: filterableColumnFields(curated),
      valueTypes: CONVERSATION_FIELD_VALUE_TYPE,
      projectableFields: projectableSchemaFields(curated, schemaFields ?? []),
    };
  }, [schemaFields, t]);

  const enrichmentFields = useMemo(() => new Set(modelScope.projectableFields?.enrichmentBacked ?? []), [modelScope]);

  const candidateRef = useRef<CandidateIds | null>(null);

  const reportFailure = useCallback(() => {
    showNotification(getErrorNotification(t(ConversationsTraceI18nKey.ConversationsLoadFailed)));
    setHasLoadError(true);
  }, [showNotification, t]);

  const datasource: IDatasource = useMemo(
    () => ({
      getRows: async (params: IGetRowsParams) => {
        const { startRow, endRow } = params;
        const isFirstPage = startRow === 0;
        const sort = translateConversationSortModel(params.sortModel, modelScope);
        const columnFilters = translateConversationFilterModel(
          params.filterModel as ConversationGridFilterModel,
          modelScope,
        );
        // A later page reuses the ids the first page of this result resolved; a stale set from a previous
        // filter state is not sent, because the first page of the new one resolves its own.
        const chatIds = candidateRef.current?.key === key ? candidateRef.current.ids : undefined;
        // The identity column's fields ride along regardless of column state: that column is always on
        // screen, so its enrichment is not optional the way a revealable column's is.
        const visibleEnrichmentFields = [
          ...(modelScope.projectableFields?.requiredEnrichment ?? []),
          ...(gridApi?.getColumnState() ?? [])
            .filter((column) => !column.hide && enrichmentFields.has(column.colId))
            .map((column) => column.colId),
        ];
        const loadedKey = resultKey(filters, columnFilters, sort);
        gridApi?.setGridOption('loading', true);
        if (isFirstPage) {
          setIsFirstPageLoading(true);
        }

        try {
          const result = await getReqRef.current(getConversations, {
            ...filters,
            columnFilters,
            sort,
            sourceFields: modelScope.projectableFields?.sourceBacked ?? [],
            visibleEnrichmentFields,
            offset: startRow,
            limit: endRow - startRow,
            ...(chatIds ? { chatIds } : {}),
          });

          // Read before the failure check: the rows and the summary are separate queries, so a failed row
          // query still carries whatever the summary resolved and the figures keep standing.
          const page = result.response as ConversationsPage | undefined;

          if (isFirstPage) {
            candidateRef.current = page?.candidates ? { key, ids: page.candidates.ids } : null;
            setIsFeedbackCapped(Boolean(page?.candidates?.isCapped));
            // An absent summary means its query failed, which the pills report as unavailable. A later
            // page carries none and leaves the figures standing.
            setTotals(page?.totals ?? null);
          }

          if (!result.success) {
            throw new Error('Failed to fetch conversations');
          }

          const rows = page?.rows ?? [];
          const total = page?.total ?? null;

          setHasLoadError(false);
          setLoaded((previous) => {
            const byId = previous.key === loadedKey ? new Map(previous.byId) : new Map<string, ConversationRow>();
            rows.forEach((row) => byId.set(row.chat_id, row));
            return { key: loadedKey, byId };
          });
          if (isFirstPage) {
            setIsEmptyResult(rows.length === 0);
          }

          // Without a total the end of the result is unknown until a page comes back short, which is the
          // signal the grid already terminates on.
          params.successCallback(rows, total ?? (rows.length < endRow - startRow ? startRow + rows.length : undefined));
        } catch {
          reportFailure();
          // A failed later page must not discard the rows already shown, so only the first page clears them.
          // The figures are settled above from whatever the response carried, so the catch leaves them be.
          if (isFirstPage) {
            setLoaded({ key: loadedKey, byId: new Map() });
            setIsEmptyResult(false);
          }
          params.failCallback();
        } finally {
          gridApi?.setGridOption('loading', false);
          if (isFirstPage) {
            setIsFirstPageLoading(false);
          }
        }
      },
    }),
    [enrichmentFields, filters, gridApi, key, modelScope, reportFailure],
  );

  // A new datasource identity is what makes a filter change restart paging: AG Grid purges its blocks
  // and re-requests from the first row.
  useEffect(() => {
    gridApi?.setGridOption('datasource', datasource);
  }, [gridApi, datasource]);

  const applySearch = useMemo(() => debounce(setAppliedSearch, CONVERSATIONS_SEARCH_DEBOUNCE_MS), []);

  useEffect(() => () => applySearch.cancel(), [applySearch]);

  const onSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      applySearch(value);
    },
    [applySearch],
  );

  const onGridReady = useCallback((event: GridReadyEvent) => setGridApi(event.api), []);

  useEffect(() => {
    if (!gridApi) {
      return;
    }

    // Only an enrichment-backed field is absent from the pages already fetched, so only revealing one of
    // those columns has anything to re-fetch. A source-backed field is in every row already.
    const onColumnVisible = (event: ColumnVisibleEvent) => {
      const colIds = (event.columns ?? []).map((column) => column.getColId()).filter(Boolean);

      if (!event.visible) {
        // A filter outliving its column keeps narrowing every later page with nothing on screen to explain
        // it — and on an enrichment field that narrowing is severe, since only the conversations the
        // evaluation has reached can match. Clearing it re-queries, which is the point: the rows have to
        // come back.
        const model = gridApi.getFilterModel();
        const remaining = Object.fromEntries(Object.entries(model).filter(([colId]) => !colIds.includes(colId)));
        if (Object.keys(remaining).length !== Object.keys(model).length) {
          gridApi.setFilterModel(remaining);
        }
        return;
      }

      if (colIds.some((colId) => enrichmentFields.has(colId))) {
        gridApi.purgeInfiniteCache();
      }
    };

    gridApi.addEventListener('columnVisible', onColumnVisible);
    return () => gridApi.removeEventListener('columnVisible', onColumnVisible);
  }, [enrichmentFields, gridApi]);

  const summary: ConversationSummary = useMemo(
    () => summariseConversations(Array.from(loaded.byId.values())),
    [loaded],
  );

  return {
    onGridReady,
    datasource,
    totals,
    summary,
    loadedCount: loaded.byId.size,
    isEmptyResult,
    isFirstPageLoading,
    isFeedbackCapped,
    hasLoadError,
    search,
    onSearchChange,
    timePeriod,
    timeRange,
    onTimePeriodChange,
    onTimeRangeChange,
    feedback,
    onFeedbackChange: setFeedback,
  };
};
