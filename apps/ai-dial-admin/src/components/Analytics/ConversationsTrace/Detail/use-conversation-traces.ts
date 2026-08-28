'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getConversationTracePage } from '@/src/app/[lang]/conversations-trace/actions';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { ConversationTraceGroup } from '@/src/models/analytics/conversations-trace';

interface Params {
  chatId: string;
  projectId: string;
  firstRequestTime: number | string | null;
  lastRequestTime: number | string | null;
}

export const useConversationTraces = ({ chatId, projectId, firstRequestTime, lastRequestTime }: Params) => {
  const [groups, setGroups] = useState<ConversationTraceGroup[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const getReqRef = useRef(useProtectedRequest());
  // A trace already on screen is never rendered twice, whatever the page returns. A late-arriving row can
  // lower a trace's earliest recorded time and move it across a page boundary, which offset paging exposes
  // as a repeat — holding the ids makes the duplicate impossible rather than unlikely.
  const loadedIdsRef = useRef(new Set<string>());
  const offsetRef = useRef(0);
  const isFetchingRef = useRef(false);

  const loadPage = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }
    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const result = await getReqRef.current(
        getConversationTracePage,
        chatId,
        projectId,
        firstRequestTime,
        lastRequestTime,
        offsetRef.current,
      );

      if (!result?.success) {
        setHasLoadError(true);
        setHasMore(false);
        return;
      }

      const page = (result.response?.groups ?? []) as ConversationTraceGroup[];
      const fresh = page.filter(({ traceId }) => !loadedIdsRef.current.has(traceId));
      fresh.forEach(({ traceId }) => loadedIdsRef.current.add(traceId));

      offsetRef.current += page.length;
      setGroups((loaded) => [...loaded, ...fresh]);
      setHasMore(result.response?.hasMore ?? false);
      setHasLoadError(false);
    } catch {
      setHasLoadError(true);
      setHasMore(false);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, [chatId, projectId, firstRequestTime, lastRequestTime]);

  // The loaded state belongs to one conversation, so it is discarded when the conversation changes. Without
  // this a reused instance would append the next conversation's traces to the previous one's, and the
  // already-loaded ids would suppress genuine rows.
  useEffect(() => {
    loadedIdsRef.current = new Set<string>();
    offsetRef.current = 0;
    isFetchingRef.current = false;
    setGroups([]);
    setHasMore(true);
    setHasLoadError(false);
    void loadPage();
  }, [loadPage]);

  const onLoadMore = useCallback(() => {
    if (hasMore && !isFetchingRef.current) {
      void loadPage();
    }
  }, [hasMore, loadPage]);

  return { groups, hasMore, isLoading, hasLoadError, onLoadMore };
};
