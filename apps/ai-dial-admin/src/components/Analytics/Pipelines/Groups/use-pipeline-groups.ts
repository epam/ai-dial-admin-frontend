'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getPipelineGroups } from '@/src/app/[lang]/pipelines/actions';
import { GROUPS_PAGE_SIZE } from '@/src/constants/analytics/pipeline-groups';
import { GroupListOrder, PipelineGroup } from '@/src/models/analytics/pipeline-groups';
import { RUNNER_INVALID_CURSOR } from '@/src/models/analytics/pipeline-runtime';

export interface PipelineGroupsRead {
  groups: PipelineGroup[];
  total: number;
  hasMore: boolean;
  order: GroupListOrder;
  isLoading: boolean;
  isLoadingMore: boolean;
  /** The first page failed; never the empty state, which says the runner holds no groups. */
  hasFailed: boolean;
  errorMessage?: string;
  reload: () => Promise<void>;
  loadMore: () => Promise<void>;
  setOrder: (order: GroupListOrder) => void;
}

/**
 * The pipeline's groups, walked page by page in one order. The walk restarts whenever it can no longer continue:
 * on a reload, on an order change, and on a cursor the runner refuses.
 */
export const usePipelineGroups = (pipelineName: string): PipelineGroupsRead => {
  const [groups, setGroups] = useState<PipelineGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [order, setOrderState] = useState(GroupListOrder.Newest);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  // Only the latest walk may land: a page asked for under an older order, or before a reload, is dropped.
  const walkId = useRef(0);
  // A ref, not the state beside it: the grid reports every scroll event, and two can arrive before a re-render
  // would let the state say a page is already on its way.
  const isPageInFlight = useRef(false);

  const readFirst = useCallback(
    async (walkOrder: GroupListOrder) => {
      const id = ++walkId.current;
      isPageInFlight.current = false;
      setIsLoading(true);
      setIsLoadingMore(false);

      try {
        const res = await getPipelineGroups(pipelineName, GROUPS_PAGE_SIZE, walkOrder);
        if (id !== walkId.current) return;

        setHasFailed(!res.success);
        setErrorMessage(res.success ? undefined : res.errorMessage);
        if (res.success && res.response) {
          setGroups(res.response.groups);
          setTotal(res.response.total);
          setCursor(res.response.next_cursor);
          setHasMore(res.response.has_more);
        }
      } catch {
        if (id !== walkId.current) return;

        setHasFailed(true);
        setErrorMessage(undefined);
      } finally {
        if (id === walkId.current) setIsLoading(false);
      }
    },
    [pipelineName],
  );

  const reload = useCallback(() => readFirst(order), [readFirst, order]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor || isLoading || isPageInFlight.current) return;

    const id = walkId.current;
    isPageInFlight.current = true;
    setIsLoadingMore(true);

    try {
      const res = await getPipelineGroups(pipelineName, GROUPS_PAGE_SIZE, order, cursor);
      if (id !== walkId.current) return;

      if (!res.success && res.errorHeader === RUNNER_INVALID_CURSOR) {
        void readFirst(order);
        return;
      }

      if (res.success && res.response) {
        const page = res.response;
        setGroups((prev) => [...prev, ...page.groups]);
        setTotal(page.total);
        setCursor(page.next_cursor);
        setHasMore(page.has_more);
      } else {
        setHasMore(false);
      }
    } catch {
      // As the failures listing does: a page that did not arrive ends the walk rather than being asked for on every
      // scroll, and a reload starts it again.
      if (id === walkId.current) setHasMore(false);
    } finally {
      isPageInFlight.current = false;
      if (id === walkId.current) setIsLoadingMore(false);
    }
  }, [hasMore, cursor, isLoading, pipelineName, order, readFirst]);

  const setOrder = useCallback(
    (next: GroupListOrder) => {
      setOrderState(next);
      void readFirst(next);
    },
    [readFirst],
  );

  useEffect(() => {
    setOrderState(GroupListOrder.Newest);
    void readFirst(GroupListOrder.Newest);
  }, [readFirst]);

  return useMemo(
    () => ({
      groups,
      total,
      hasMore,
      order,
      isLoading,
      isLoadingMore,
      hasFailed,
      errorMessage,
      reload,
      loadMore,
      setOrder,
    }),
    [groups, total, hasMore, order, isLoading, isLoadingMore, hasFailed, errorMessage, reload, loadMore, setOrder],
  );
};
