'use client';

import { GridApi, GridReadyEvent, IDatasource, IGetRowsParams } from 'ag-grid-community';
import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getConversationTotals, getConversations, getRatedChatIds } from '@/src/app/[lang]/conversations-trace/actions';
import {
  CONVERSATIONS_SEARCH_DEBOUNCE_MS,
  CONVERSATIONS_TIME_PERIOD,
} from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useTimeFilter } from '@/src/hooks/use-time-filter';
import { useI18n } from '@/src/locales/client';
import {
  ConversationFilters,
  ConversationRow,
  ConversationSummary,
  ConversationTotals,
  FeedbackFilter,
} from '@/src/models/analytics/conversations-trace';
import { summariseConversations } from '@/src/utils/analytics/conversation-rows';
import { getErrorNotification } from '@/src/utils/notification';

const filterKey = ({ search, startMs, endMs, feedback }: ConversationFilters): string =>
  [search, startMs, endMs, feedback].join('|');

interface CandidateIds {
  key: string;
  // The promise, not the resolved ids: the list query and the totals query both need the candidate set
  // and run concurrently, so caching the in-flight request is what stops them issuing two of it and
  // possibly narrowing by two different sets.
  pending: Promise<string[]>;
}

export const useConversations = (initialTotals: ConversationTotals | null, hasInitialLoadError = false) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  const [gridApi, setGridApi] = useState<GridApi<ConversationRow> | null>(null);

  const [hasLoadError, setHasLoadError] = useState(hasInitialLoadError);
  const [totals, setTotals] = useState<ConversationTotals | null>(initialTotals);
  const [loadedRows, setLoadedRows] = useState<ConversationRow[]>([]);
  const [isEmptyResult, setIsEmptyResult] = useState(false);
  const [isFirstPageLoading, setIsFirstPageLoading] = useState(true);

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

  const candidateRef = useRef<CandidateIds | null>(null);

  const reportFailure = useCallback(() => {
    showNotification(getErrorNotification(t(ConversationsTraceI18nKey.ConversationsLoadFailed)));
    setHasLoadError(true);
  }, [showNotification, t]);

  // An active feedback state narrows the list by `in`, so its candidate ids must be resolved before the
  // first page and then reused for every page of that same result.
  const resolveCandidates = useCallback(async (): Promise<string[] | null> => {
    if (filters.feedback === FeedbackFilter.All) {
      return null;
    }
    if (candidateRef.current?.key === key) {
      return candidateRef.current.pending;
    }

    const pending = getReqRef.current(getRatedChatIds, filters).then((result) => {
      if (!result.success) {
        // Dropped so a later attempt re-issues it rather than replaying the failure forever.
        candidateRef.current = null;
        throw new Error('Failed to resolve rated conversations');
      }
      return (result.response as { ids: string[] } | undefined)?.ids ?? [];
    });

    candidateRef.current = { key, pending };
    return pending;
  }, [filters, key]);

  const datasource: IDatasource = useMemo(
    () => ({
      getRows: async (params: IGetRowsParams) => {
        const { startRow, endRow } = params;
        const isFirstPage = startRow === 0;
        gridApi?.setGridOption('loading', true);
        if (isFirstPage) {
          setIsFirstPageLoading(true);
        }

        try {
          const chatIds = await resolveCandidates();
          const result = await getReqRef.current(getConversations, {
            ...filters,
            offset: startRow,
            limit: endRow - startRow,
            ...(chatIds ? { chatIds } : {}),
          });

          if (!result.success) {
            throw new Error('Failed to fetch conversations');
          }

          const page = result.response as { rows: ConversationRow[]; total: number | null } | undefined;
          const rows = page?.rows ?? [];
          const total = page?.total ?? null;

          setHasLoadError(false);
          // A later page appends; the first page of a new filter state replaces what came before.
          setLoadedRows((previous) => (isFirstPage ? rows : [...previous, ...rows]));
          if (isFirstPage) {
            setIsEmptyResult(rows.length === 0);
          }

          params.successCallback(rows, total ?? (rows.length < endRow - startRow ? startRow + rows.length : undefined));
        } catch {
          reportFailure();
          // A failed later page must not discard the rows already shown, so only the first page clears them.
          if (isFirstPage) {
            setLoadedRows([]);
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
    [filters, gridApi, reportFailure, resolveCandidates],
  );

  // A new datasource identity is what makes a filter change restart paging: AG Grid purges its blocks
  // and re-requests from the first row.
  useEffect(() => {
    gridApi?.setGridOption('datasource', datasource);
  }, [gridApi, datasource]);

  const totalsRequestRef = useRef(0);
  const isFirstTotalsRunRef = useRef(true);

  useEffect(() => {
    // The server component already prefetched the totals for the filters the controls mount with.
    if (isFirstTotalsRunRef.current) {
      isFirstTotalsRunRef.current = false;
      return;
    }

    const requestId = ++totalsRequestRef.current;

    const load = async () => {
      try {
        const chatIds = await resolveCandidates();
        const result = await getReqRef.current(getConversationTotals, filters, chatIds ?? undefined);

        if (requestId !== totalsRequestRef.current) {
          return;
        }

        setTotals(result.success ? ((result.response as ConversationTotals | undefined) ?? null) : null);
      } catch {
        if (requestId === totalsRequestRef.current) {
          setTotals(null);
        }
      }
    };

    load();
  }, [filters, resolveCandidates]);

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

  const summary: ConversationSummary = useMemo(() => summariseConversations(loadedRows), [loadedRows]);

  return {
    onGridReady,
    datasource,
    totals,
    summary,
    loadedCount: loadedRows.length,
    isEmptyResult,
    isFirstPageLoading,
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
