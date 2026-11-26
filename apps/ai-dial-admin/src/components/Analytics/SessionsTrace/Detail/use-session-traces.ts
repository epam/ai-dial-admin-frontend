'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getSessionTracePage } from '@/src/app/[lang]/sessions/actions';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { SessionScope, SessionTraceCursor, SessionTraceGroup } from '@/src/models/analytics/sessions-trace';

interface Params {
  scope: SessionScope;
  projectId: string | null;
  firstRequestTime: number | string | null;
  lastRequestTime: number | string | null;
  traceId?: string;
}

export const useSessionTraces = ({ scope, projectId, firstRequestTime, lastRequestTime, traceId }: Params) => {
  const [groups, setGroups] = useState<SessionTraceGroup[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const getReqRef = useRef(useProtectedRequest());
  // A trace already on screen is never rendered twice, whatever the page returns. A late-arriving row can
  // lower a trace's earliest recorded time and move it past the cursor, so two pages can return it — holding
  // the ids makes the duplicate impossible rather than unlikely.
  const loadedIdsRef = useRef(new Set<string>());
  const cursorRef = useRef<SessionTraceCursor | null>(null);
  const isFetchingRef = useRef(false);
  const generationRef = useRef(0);

  const loadPage = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }
    isFetchingRef.current = true;
    setIsLoading(true);
    const generation = generationRef.current;

    try {
      const result = await getReqRef.current(
        getSessionTracePage,
        scope,
        projectId,
        firstRequestTime,
        lastRequestTime,
        cursorRef.current,
        traceId,
      );

      if (generation !== generationRef.current) {
        return;
      }

      if (!result?.success) {
        setHasLoadError(true);
        setHasMore(false);
        return;
      }

      const page = (result.response?.groups ?? []) as SessionTraceGroup[];
      const fresh = page.filter(({ traceId }) => !loadedIdsRef.current.has(traceId));
      fresh.forEach(({ traceId }) => loadedIdsRef.current.add(traceId));

      cursorRef.current = result.response?.cursor ?? null;
      setGroups((loaded) => [...loaded, ...fresh]);
      setHasMore(result.response?.hasMore ?? false);
      setHasLoadError(false);
    } catch {
      if (generation === generationRef.current) {
        setHasLoadError(true);
        setHasMore(false);
      }
    } finally {
      if (generation === generationRef.current) {
        isFetchingRef.current = false;
        setIsLoading(false);
      }
    }
  }, [scope, projectId, firstRequestTime, lastRequestTime, traceId]);

  // The loaded state belongs to one session and one search, so it is discarded when either changes. Without
  // this a reused instance would append the next session's traces to the previous one's, and the
  // already-loaded ids would suppress genuine rows.
  useEffect(() => {
    generationRef.current += 1;
    loadedIdsRef.current = new Set<string>();
    cursorRef.current = null;
    isFetchingRef.current = false;
    setGroups([]);
    setHasMore(true);
    setHasLoadError(false);
    setIsLoading(true);
    void loadPage();
  }, [loadPage]);

  const onLoadMore = useCallback(() => {
    if (hasMore && !isFetchingRef.current) {
      void loadPage();
    }
  }, [hasMore, loadPage]);

  return { groups, hasMore, isLoading, hasLoadError, isSearch: Boolean(traceId), onLoadMore };
};
