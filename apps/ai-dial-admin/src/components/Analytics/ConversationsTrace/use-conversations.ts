'use client';

import { ColumnVisibleEvent, GridApi, GridReadyEvent, IDatasource, IGetRowsParams } from 'ag-grid-community';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getConversationFieldValues, getConversations } from '@/src/app/[lang]/conversations-trace/actions';
import {
  CONVERSATIONS_SEARCH_DEBOUNCE_MS,
  CONVERSATIONS_TIME_PERIOD,
} from '@/src/constants/analytics/conversations-trace';
import { CONVERSATIONS_TRACE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useTimeFilter } from '@/src/hooks/use-time-filter';
import { useI18n } from '@/src/locales/client';
import {
  ConversationArrayFilter,
  ConversationColumnFilter,
  ConversationFieldValue,
  ConversationFilters,
  ConversationGridContext,
  ConversationPeriodSummary,
  ConversationRow,
  ConversationsPage,
  FeedbackFilter,
} from '@/src/models/analytics/conversations-trace';
import { AnalyticsEntityField } from '@/src/models/analytics/entity';
import {
  catalogValueTypes,
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
import { getErrorNotification } from '@/src/utils/notification';
import { timePeriodLabel } from '@/src/utils/time-filter/period-label';

const filterKey = ({ search, startMs, endMs, feedback }: ConversationFilters): string =>
  [search, startMs, endMs, feedback].join('|');

// The ids the first page of a result resolved, held for the rest of that result's pages. It stays in the
// browser: the set is resolved under the caller's token, so a server-side cache keyed on the filter state
// would narrow one caller's result by ids another caller's token selected.
interface CandidateIds {
  key: string;
  ids: string[];
}

// Keyed on everything the resolution depends on — the period and the column filters — so a new result
// resolves its own sets rather than inheriting one that no longer describes it.
interface ResolvedArrayFilters {
  key: string;
  filters: ConversationArrayFilter[];
}

const arrayFilterKey = (filters: ConversationFilters, columnFilters: ConversationColumnFilter[]): string =>
  JSON.stringify([filters.startMs, filters.endMs, columnFilters]);

export const useConversations = (schemaFields?: AnalyticsEntityField[] | null) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  const [gridApi, setGridApi] = useState<GridApi<ConversationRow> | null>(null);

  const [hasLoadError, setHasLoadError] = useState(false);
  const [period, setPeriod] = useState<ConversationPeriodSummary | null>(null);
  const [isEmptyResult, setIsEmptyResult] = useState(false);
  const [isFirstPageLoading, setIsFirstPageLoading] = useState(true);
  const [isFeedbackCapped, setIsFeedbackCapped] = useState(false);

  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [feedback, setFeedback] = useState(FeedbackFilter.All);

  const { timePeriod, timeRange, isCustom, onTimePeriodChange, onTimeRangeChange } = useTimeFilter({
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
    const columns = CONVERSATIONS_TRACE_COLUMNS(t, schemaFields ?? []);
    return {
      sortableFields: sortableColumnFields(columns),
      filterableFields: filterableColumnFields(columns),
      valueTypes: catalogValueTypes(schemaFields ?? []),
      projectableFields: projectableSchemaFields(columns, schemaFields ?? []),
    };
  }, [schemaFields, t]);

  // The fields whose columns must be re-fetched when revealed, for the two different reasons a page can lack
  // one: an enrichment field was never joined, and a heavy field was deliberately left out of the projection.
  const gatedFields = useMemo(
    () =>
      new Set([
        ...(modelScope.projectableFields?.enrichment ?? []),
        ...(modelScope.projectableFields?.heavySource ?? []),
      ]),
    [modelScope],
  );

  const candidateRef = useRef<CandidateIds | null>(null);
  const arrayFilterRef = useRef<ResolvedArrayFilters | null>(null);

  // The filter state the page is currently showing. A request carries the key it was issued under, so a
  // response that outlives its filter state can be told apart from the current one at the moment it lands.
  const keyRef = useRef(key);
  keyRef.current = key;

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
        // Same rule for the resolved value sets, on their own key.
        const arrayKey = arrayFilterKey(filters, columnFilters);
        const arrayFilters =
          !isFirstPage && arrayFilterRef.current?.key === arrayKey ? arrayFilterRef.current.filters : undefined;
        const visibleGatedFields = (gridApi?.getColumnState() ?? [])
          .filter((column) => !column.hide && gatedFields.has(column.colId))
          .map((column) => column.colId);
        const heavySource = new Set(modelScope.projectableFields?.heavySource ?? []);
        // A revealed heavy field is still a plain column of the table already being read, so it joins the
        // source projection rather than the enrichment one: it is gated for transfer cost, not for a join.
        const sourceFields = [
          ...(modelScope.projectableFields?.cheapSource ?? []),
          ...visibleGatedFields.filter((colId) => heavySource.has(colId)),
        ];
        // The identity column's fields ride along regardless of column state: that column is always on
        // screen, so its enrichment is not optional the way a revealable column's is.
        const visibleEnrichmentFields = [
          ...(modelScope.projectableFields?.requiredEnrichment ?? []),
          ...visibleGatedFields.filter((colId) => !heavySource.has(colId)),
        ];
        gridApi?.setGridOption('loading', true);
        if (isFirstPage) {
          setIsFirstPageLoading(true);
        }

        try {
          const result = await getReqRef.current(getConversations, {
            ...filters,
            columnFilters,
            sort,
            sourceFields,
            visibleEnrichmentFields,
            offset: startRow,
            limit: endRow - startRow,
            ...(chatIds ? { chatIds } : {}),
            ...(arrayFilters ? { arrayFilters } : {}),
          });

          // Read before the failure check: the rows and the summary are separate queries, so a failed row
          // query still carries whatever the summary resolved and the figures keep standing.
          const page = result.response as ConversationsPage | undefined;

          if (isFirstPage) {
            candidateRef.current = page?.candidates ? { key, ids: page.candidates.ids } : null;
            arrayFilterRef.current = page?.arrayFilters ? { key: arrayKey, filters: page.arrayFilters } : null;
            setIsFeedbackCapped(Boolean(page?.candidates?.isCapped));
            // Nothing cancels a request whose filter state has moved on, so a slow response can land after
            // the period changed and put the previous period's figures under the new caption — the exact
            // mismatch clearing them was meant to prevent. Only the current filter state may set them.
            // An absent summary means its queries failed, which the pills report as unavailable; a later
            // page carries none and leaves the figures standing.
            if (keyRef.current === key) {
              setPeriod(page?.period ?? null);
            }
          }

          if (!result.success) {
            throw new Error('Failed to fetch conversations');
          }

          const rows = page?.rows ?? [];
          const total = page?.total ?? null;

          setHasLoadError(false);
          if (isFirstPage) {
            setIsEmptyResult(rows.length === 0);
          }

          // Without a total the end of the result is unknown until a page comes back short, which is the
          // signal the grid already terminates on.
          params.successCallback(rows, total ?? (rows.length < endRow - startRow ? startRow + rows.length : undefined));
        } catch {
          reportFailure();
          // A failed later page must not discard the rows already shown, so only the first page resets the
          // empty state. The figures are settled above from whatever the response carried.
          if (isFirstPage) {
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
    [filters, gatedFields, gridApi, key, modelScope, reportFailure],
  );

  // The opened column's own filter is sent along and dropped by the query builder, which is where that rule
  // is stated and tested.
  const requestFieldValues = useCallback(
    async (fieldName: string): Promise<ConversationFieldValue[] | null> => {
      const columnFilters = translateConversationFilterModel(
        gridApi?.getFilterModel() as ConversationGridFilterModel,
        modelScope,
      );
      const chatIds = candidateRef.current?.key === key ? candidateRef.current.ids : undefined;
      const arrayKey = arrayFilterKey(filters, columnFilters);
      const arrayFilters = arrayFilterRef.current?.key === arrayKey ? arrayFilterRef.current.filters : undefined;

      const result = await getConversationFieldValues({
        ...filters,
        field: fieldName,
        columnFilters,
        ...(chatIds ? { chatIds } : {}),
        ...(arrayFilters ? { arrayFilters } : {}),
      });

      return result.success ? (result.response ?? []) : null;
    },
    [filters, gridApi, key, modelScope],
  );

  const gridContext: ConversationGridContext = useMemo(() => ({ requestFieldValues }), [requestFieldValues]);

  // A new datasource identity is what makes a filter change restart paging: AG Grid purges its blocks
  // and re-requests from the first row.
  useEffect(() => {
    gridApi?.setGridOption('datasource', datasource);
  }, [gridApi, datasource]);

  // Keyed on the period alone, not the whole filter state: the caption repaints the moment the period
  // changes, while the figures only arrive when the refetch resolves, so holding the old ones would put a
  // 30d caption over 7d numbers. A search or column change leaves them standing — it does not move them.
  useEffect(() => {
    setPeriod(null);
  }, [filters.startMs, filters.endMs]);

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

      if (colIds.some((colId) => gatedFields.has(colId))) {
        gridApi.purgeInfiniteCache();
      }
    };

    gridApi.addEventListener('columnVisible', onColumnVisible);
    return () => gridApi.removeEventListener('columnVisible', onColumnVisible);
  }, [gatedFields, gridApi]);

  return {
    onGridReady,
    datasource,
    gridContext,
    period,
    periodLabel: timePeriodLabel(timePeriod, timeRange, isCustom),
    isPeriodPending: period === null && isFirstPageLoading,
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
