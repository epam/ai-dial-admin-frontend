'use client';

import { useEffect, useMemo, useState } from 'react';

import { executeStructuredQuery } from '@/src/app/[lang]/runs/actions';
import { getDeployments } from '@/src/app/[lang]/test-suites/actions';
import { COVERAGE_WINDOW_DAYS, MS_PER_DAY } from '@/src/components/EvalSystemHealth/constants';
import {
  CoverageCardModel,
  CoverageSource,
  CoverageSources,
  CoverageStatus,
  CoveredIds,
  ListedDeploymentIds,
} from '@/src/components/EvalSystemHealth/models';
import { useStartOfToday } from '@/src/components/EvalSystemHealth/use-start-of-today';
import { buildCoverageCards } from '@/src/components/EvalSystemHealth/utils/build-coverage-cards';
import { buildCoverageQuery } from '@/src/components/EvalSystemHealth/utils/build-coverage-query';
import { groupDeploymentIds } from '@/src/components/EvalSystemHealth/utils/group-deployment-ids';
import { parseCoverageRows } from '@/src/components/EvalSystemHealth/utils/parse-coverage-rows';
import { StructuredQueryResult } from '@/src/models/evaluation/structured-query';

const LOADING: CoverageSources = {
  deployments: { status: CoverageStatus.Loading },
  covered: { status: CoverageStatus.Loading },
};

const FAILED: CoverageSource<never> = { status: CoverageStatus.Error };

const ready = <T>(value: T): CoverageSource<T> => ({ status: CoverageStatus.Ready, value });

/** Never rejects: a source that cannot be read is reported as failed, so the other still settles. */
const loadDeploymentIds = async (): Promise<CoverageSource<ListedDeploymentIds>> => {
  try {
    const result = await getDeployments();
    if (!result?.success) {
      return FAILED;
    }
    return ready(groupDeploymentIds(result.response ?? []));
  } catch {
    return FAILED;
  }
};

/** Never rejects, and treats a `null` result (the API's way of reporting a failed read) as a failure. */
const loadCoveredIds = async (windowStartMs: number): Promise<CoverageSource<CoveredIds>> => {
  try {
    const result = await executeStructuredQuery(buildCoverageQuery(windowStartMs));
    if (result == null) {
      return FAILED;
    }
    return ready(parseCoverageRows(result as StructuredQueryResult));
  } catch {
    return FAILED;
  }
};

/**
 * Loads the coverage inputs — one deployment listing split by `$type` on this side, and one coverage query —
 * and returns the four cards. Each source is applied as it settles. The inputs are loaded again when the day
 * rolls over while the page is open, so the 30-day window follows the calendar.
 */
export const useCoverageData = (): CoverageCardModel[] => {
  const [sources, setSources] = useState<CoverageSources>(LOADING);
  const startOfToday = useStartOfToday();

  useEffect(() => {
    let isCancelled = false;

    setSources(LOADING);
    const apply = async <K extends keyof CoverageSources>(key: K, task: Promise<CoverageSources[K]>) => {
      const source = await task;
      if (!isCancelled) {
        setSources((prev) => ({ ...prev, [key]: source }));
      }
    };

    const windowStartMs = Date.now() - COVERAGE_WINDOW_DAYS * MS_PER_DAY;

    void Promise.all([apply('deployments', loadDeploymentIds()), apply('covered', loadCoveredIds(windowStartMs))]);

    return () => {
      isCancelled = true;
    };
  }, [startOfToday]);

  return useMemo(() => buildCoverageCards(sources), [sources]);
};
