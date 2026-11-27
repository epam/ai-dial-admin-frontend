'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { getRunTrends } from '@/src/app/[lang]/runs/actions';
import { RUN_TRENDS_PAGE_SIZE } from '@/src/components/EvalSystemHealth/constants';
import { CoverageStatus, RunTrendsData } from '@/src/components/EvalSystemHealth/models';
import { buildRunTrendRows } from '@/src/components/EvalSystemHealth/utils/build-run-trend-rows';
import { SuiteRunTrend } from '@/src/models/evaluation/run-trend';
import { EvaluationPageData } from '@/src/models/request';

type RunTrendsPage = EvaluationPageData<SuiteRunTrend>;

interface LoadState {
  status: CoverageStatus;
  data: RunTrendsPage | null;
}

const LOADING: LoadState = { status: CoverageStatus.Loading, data: null };
const FAILED: LoadState = { status: CoverageStatus.Error, data: null };

/** Never rejects: a request that cannot be read is reported as `null`, the API's own way of reporting a failure. */
const loadPage = async (page: number): Promise<RunTrendsPage | null> => {
  try {
    return await getRunTrends(page, RUN_TRENDS_PAGE_SIZE);
  } catch {
    return null;
  }
};

/**
 * Loads the run-trends table one page at a time. A response for a page the user has already left is dropped,
 * and the rows are cleared while a page loads so a stale page is never shown as the current one.
 */
export const useRunTrendsData = (): RunTrendsData => {
  const [page, setPage] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>(LOADING);

  useEffect(() => {
    let isCancelled = false;

    setState(LOADING);
    const load = async () => {
      const result = await loadPage(page);
      if (isCancelled) {
        return;
      }
      if (result == null) {
        setState(FAILED);
        return;
      }
      // A suite deleted since the last page can leave this page past the end: step back instead of showing nothing.
      if (result.totalPages > 0 && page >= result.totalPages) {
        setPage(result.totalPages - 1);
        return;
      }
      setState({ status: CoverageStatus.Ready, data: result });
    };
    void load();

    return () => {
      isCancelled = true;
    };
  }, [page, attempt]);

  const goToPreviousPage = useCallback(() => setPage((current) => Math.max(current - 1, 0)), []);
  const goToNextPage = useCallback(() => setPage((current) => current + 1), []);
  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  const rows = useMemo(() => buildRunTrendRows(state.data?.content ?? []), [state.data]);

  return {
    status: state.status,
    rows,
    page,
    totalPages: state.data?.totalPages ?? 0,
    totalElements: state.data?.totalElements ?? 0,
    goToPreviousPage,
    goToNextPage,
    retry,
  };
};
