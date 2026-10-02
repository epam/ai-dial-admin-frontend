'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getPipelineFailures } from '@/src/app/[lang]/pipelines/actions';
import { DLQ_PAGE_SIZE, DLQ_SUMMARY_LIMIT } from '@/src/constants/analytics/pipeline-dlq';
import { useAppContext } from '@/src/context/AppContext';
import { countsOf } from '@/src/components/Analytics/Pipelines/Failures/failures';
import { DlqCounts, DlqFilters, DlqItem, DlqLane, DlqPage } from '@/src/models/analytics/pipeline-dlq';
import { RUNNER_NOT_CONFIGURED } from '@/src/models/analytics/pipeline-runtime';
import { ServerActionResponse } from '@/src/models/server-action';

const NO_COUNTS: DlqCounts = { total: 0, retryable: 0, notRetryable: 0 };

/** No path and no run: the whole pipeline, which is what the summary must describe. */
const EVERY_PATH: DlqFilters = {};

export interface PipelineFailuresRead {
  /** What the pipeline holds, from the service's own counters — never narrowed by the grid's filter. */
  counts: DlqCounts;
  /** When the newest failure happened, for the card's age line. */
  newestAt?: string;
  /** The rows loaded so far under the current filter, oldest page last. */
  items: DlqItem[];
  /** The service has a further page for the current filter. */
  hasMore: boolean;
  /** The summary or the first page is in flight. */
  isLoading: boolean;
  /** A further page is in flight. */
  isLoadingMore: boolean;
  /** The service was asked and did not answer. Kept apart from "no failures", which it is not. */
  hasFailed: boolean;
  /** No runner is configured. Nothing is presented and nothing is called a failure. */
  isUnavailable: boolean;
  filters: DlqFilters;
  /** Narrows by path. Clears any run filter: the service refuses the two together. */
  setLane: (lane?: DlqLane) => void;
  /** Narrows to one backfill run, replacing the path. */
  setRun: (runId?: string) => void;
  /** Appends the next page under the current filter. */
  loadMore: () => Promise<void>;
  /** Re-reads the summary and restarts the listing from its first page. */
  reload: () => Promise<void>;
  /** How many of one run's failures the service would re-run. One read, so one number. */
  readRunRetryable: (runId: string) => Promise<number | null>;
}

const isNoRunner = (res?: ServerActionResponse): boolean => res?.errorHeader === RUNNER_NOT_CONFIGURED;

/**
 * One pipeline's dead letters, read from the runtime service.
 *
 * Read on the client for the same reason the pauses are: the service authorizes every endpoint on
 * full-admin rights, and only the client knows who the caller is. A server-side read would issue a
 * request for every caller and let the service refuse it, putting a 403 in the log of every read-only
 * admin who opens a pipeline.
 *
 * **Two reads, two jobs.** The summary asks for the whole pipeline with the smallest legal page, and
 * its answer — the service's `total` and `requeueable_total`, counted over the filter in the page's own
 * snapshot — is what the card and the tab state. The listing asks page by page under whatever the
 * reader has narrowed to. Keeping them apart is what lets a path choice change the rows without moving
 * the headline above them; refreshing both on every reload is what stops the headline going stale.
 *
 * The caller decides whether there is anything to ask about: `isAsked` folds in the feature flag and
 * whether this kind of pipeline dead-letters at all. The rights are read here, from the same context
 * the rest of the runtime surface reads them from.
 */
export const usePipelineFailures = (name: string, isAsked: boolean): PipelineFailuresRead => {
  const { isFullAdmin } = useAppContext();

  const [counts, setCounts] = useState<DlqCounts>(NO_COUNTS);
  const [newestAt, setNewestAt] = useState<string | undefined>(undefined);
  const [items, setItems] = useState<DlqItem[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const [filters, setFilters] = useState<DlqFilters>(EVERY_PATH);

  const isMounted = useRef(true);
  // Only the newest walk may write. A filter changed twice in quick succession, or a reload racing a
  // filter change, lands in whichever order the service answers; the loser would leave the grid showing
  // a page nobody asked for.
  const latestWalk = useRef(0);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  const canAsk = isFullAdmin && isAsked;

  /** One page, or null when the read did not answer. Never throws: a rejection is a failed read. */
  const fetchPage = useCallback(
    async (next: DlqFilters, limit: number, after?: string): Promise<ServerActionResponse<DlqPage> | null> => {
      try {
        return await getPipelineFailures(name, next, limit, after);
      } catch {
        // A transport failure rejects rather than resolving. Answered as a read that did not answer,
        // so every caller has one shape to handle and nothing escapes as an unhandled rejection.
        return null;
      }
    },
    [name],
  );

  /**
   * The whole pipeline's counters and its newest failure, whatever the grid is narrowed to.
   *
   * Guarded by the same walk as the listing: without it an older summary landing after a newer one
   * put the pre-requeue total back on the card, and a failed summary could clear the `hasFailed` its
   * own listing had just set.
   */
  const readSummary = useCallback(
    async (walk: number) => {
      const res = await fetchPage(EVERY_PATH, DLQ_SUMMARY_LIMIT);

      if (!isMounted.current || walk !== latestWalk.current) return;

      // Nothing the card states survives a read it cannot vouch for: a stale total under a vanished
      // card is what kept the red mark on the tab after the runner went away.
      if (isNoRunner(res ?? undefined)) {
        setIsUnavailable(true);
        setHasFailed(false);
        setCounts(NO_COUNTS);
        setNewestAt(undefined);
        return;
      }

      setIsUnavailable(false);

      if (!res?.success || !res.response) {
        setHasFailed(true);
        setCounts(NO_COUNTS);
        setNewestAt(undefined);
        return;
      }

      setHasFailed(false);
      setCounts(countsOf(res.response));
      setNewestAt(res.response.items[0]?.created_at);
    },
    [fetchPage],
  );

  /** The first page under a filter, replacing whatever was listed. */
  const readFirstPage = useCallback(
    async (next: DlqFilters, walk: number) => {
      const res = await fetchPage(next, DLQ_PAGE_SIZE);

      if (!isMounted.current || walk !== latestWalk.current) return;

      if (!res?.success || !res.response) {
        setItems([]);
        setCursor(undefined);
        setHasMore(false);
        if (!isNoRunner(res ?? undefined)) setHasFailed(true);
        return;
      }

      setItems(res.response.items);
      setCursor(res.response.next_cursor ?? undefined);
      setHasMore(res.response.has_more);
    },
    [fetchPage],
  );

  const read = useCallback(
    async (next: DlqFilters) => {
      if (!canAsk) return;

      const walk = ++latestWalk.current;
      setIsLoading(true);
      // Dropped before the request, not after it answers: between the two the filter is already the
      // new one while the cursor is still the old one's, and a scroll in that window paged a
      // different result set into this one — colliding row ids and all.
      setItems([]);
      setCursor(undefined);
      setHasMore(false);

      try {
        await Promise.all([readSummary(walk), readFirstPage(next, walk)]);
      } finally {
        if (isMounted.current && walk === latestWalk.current) setIsLoading(false);
      }
    },
    [canAsk, readSummary, readFirstPage],
  );

  useEffect(() => {
    void read(filters);
  }, [read, filters]);

  const loadMore = useCallback(async () => {
    if (!canAsk || !hasMore || !cursor || isLoadingMore || isLoading) return;

    const walk = latestWalk.current;
    setIsLoadingMore(true);

    try {
      const res = await fetchPage(filters, DLQ_PAGE_SIZE, cursor);

      if (!isMounted.current || walk !== latestWalk.current) return;

      if (!res?.success || !res.response) {
        // A page that did not arrive ends the walk rather than being asked for again by every further
        // scroll. Re-reading the listing is how a reader gets past it.
        setHasMore(false);
        return;
      }

      setItems((prev) => [...prev, ...(res.response as DlqPage).items]);
      setCursor((res.response as DlqPage).next_cursor ?? undefined);
      setHasMore((res.response as DlqPage).has_more);
    } finally {
      if (isMounted.current) setIsLoadingMore(false);
    }
  }, [canAsk, hasMore, cursor, isLoadingMore, isLoading, fetchPage, filters]);

  const reload = useCallback(() => read(filters), [read, filters]);

  /**
   * How many of one run's failures carry a payload, asked of the service rather than counted from the
   * rows on screen. The rows are a page; a count taken from them would be a different number from the
   * one the re-run acts on, and the control and its confirmation would disagree.
   */
  const readRunRetryable = useCallback(
    async (runId: string): Promise<number | null> => {
      const res = await fetchPage({ runId }, DLQ_SUMMARY_LIMIT);
      const total = res?.success ? res.response?.requeueable_total : undefined;

      // Narrowed rather than trusted: the member is typed on the page but a build that predates the
      // counters omits it, and `undefined` would read as "this run has nothing to re-run".
      return typeof total === 'number' ? total : null;
    },
    [fetchPage],
  );

  // Each replaces the other rather than merging: a run is a backfill run by definition, and the service
  // answers 400 for a request naming both a live path and a run.
  const setLane = useCallback((lane?: DlqLane) => setFilters(lane ? { lane } : EVERY_PATH), []);
  const setRun = useCallback((runId?: string) => setFilters(runId ? { runId } : EVERY_PATH), []);

  return useMemo(
    () => ({
      counts,
      newestAt,
      items,
      hasMore,
      isLoading,
      isLoadingMore,
      hasFailed,
      isUnavailable,
      filters,
      setLane,
      setRun,
      loadMore,
      reload,
      readRunRetryable,
    }),
    [
      counts,
      newestAt,
      items,
      hasMore,
      isLoading,
      isLoadingMore,
      hasFailed,
      isUnavailable,
      filters,
      setLane,
      setRun,
      loadMore,
      reload,
      readRunRetryable,
    ],
  );
};
