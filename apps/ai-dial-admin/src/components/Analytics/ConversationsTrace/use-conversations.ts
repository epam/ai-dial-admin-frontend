'use client';

import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getConversations } from '@/src/app/[lang]/conversations-trace/actions';
import {
  CONVERSATIONS_SEARCH_DEBOUNCE_MS,
  CONVERSATIONS_TIME_PERIOD,
} from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useTimeFilter } from '@/src/hooks/use-time-filter';
import { useI18n } from '@/src/locales/client';
import { ConversationFilters, ConversationRow, FeedbackFilter } from '@/src/models/analytics/conversations-trace';
import { getErrorNotification } from '@/src/utils/notification';

const filterKey = ({ search, startMs, endMs, feedback }: ConversationFilters): string =>
  [search, startMs, endMs, feedback].join('|');

export const useConversations = (initialConversations: ConversationRow[], hasInitialLoadError = false) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  const [conversations, setConversations] = useState(initialConversations);
  const [hasLoadError, setHasLoadError] = useState(hasInitialLoadError);
  const [isLoading, setIsLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  const [feedback, setFeedback] = useState(FeedbackFilter.All);

  const { timePeriod, timeRange, onTimePeriodChange, onTimeRangeChange } = useTimeFilter({
    defaultTimeFilter: CONVERSATIONS_TIME_PERIOD,
  });

  const requestIdRef = useRef(0);

  const fetchConversations = useCallback(
    async (filters: ConversationFilters) => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);

      const result = await getReqRef.current(getConversations, filters);

      if (requestId !== requestIdRef.current) {
        return;
      }

      // An empty grid is indistinguishable from "the period really had no conversations", so a failed
      // request has to announce itself — both as a toast and as the state the empty grid reports.
      if (!result.success) {
        showNotification(getErrorNotification(t(ConversationsTraceI18nKey.ConversationsLoadFailed)));
      }

      setHasLoadError(!result.success);
      setConversations((result.response?.rows as ConversationRow[]) ?? []);
      setIsLoading(false);
    },
    [showNotification, t],
  );

  // Keyed on the filters themselves rather than on a "have I mounted" flag. StrictMode runs effects twice in
  // dev, and a first-run flag treats the second pass as a change — refetching what the server prefetched.
  // Comparing filters makes the second pass a no-op, since the filters have not moved.
  const fetchedFiltersRef = useRef<string | null>(null);

  useEffect(() => {
    const filters: ConversationFilters = {
      search: appliedSearch,
      startMs: timeRange.startDate.getTime(),
      endMs: timeRange.endDate.getTime(),
      feedback,
    };

    const key = filterKey(filters);
    const previousKey = fetchedFiltersRef.current;
    fetchedFiltersRef.current = key;

    // null means these are the filters the server already fetched for.
    if (previousKey === null || previousKey === key) {
      return;
    }

    fetchConversations(filters);
  }, [appliedSearch, timeRange, feedback, fetchConversations]);

  const applySearch = useMemo(() => debounce(setAppliedSearch, CONVERSATIONS_SEARCH_DEBOUNCE_MS), []);

  useEffect(() => () => applySearch.cancel(), [applySearch]);

  const onSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      applySearch(value);
    },
    [applySearch],
  );

  return {
    conversations,
    hasLoadError,
    isLoading,
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
