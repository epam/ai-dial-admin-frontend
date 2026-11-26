'use client';

import { useEffect, useMemo, useState } from 'react';

import { executeStructuredQuery } from '@/src/app/[lang]/runs/actions';
import { getDeployments, listPlatformRoutes } from '@/src/app/[lang]/test-suites/actions';
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
import { DialFileNodeType } from '@/src/models/dial/file';
import { StructuredQueryResult } from '@/src/models/evaluation/structured-query';

const LOADING: CoverageSources = {
  deployments: { status: CoverageStatus.Loading },
  routes: { status: CoverageStatus.Loading },
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

/**
 * Never rejects. The listing reports a failed page as `null` (a 403 as `undefined`), and a folder is not a route.
 * A row with no node type is taken for an item, as the Create Test Suite dialog does.
 */
const loadRouteNames = async (): Promise<CoverageSource<string[]>> => {
  try {
    const rows = await listPlatformRoutes();
    if (rows == null) {
      return FAILED;
    }
    return ready(rows.filter((row) => row.nodeType !== DialFileNodeType.FOLDER).map((row) => row.name));
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
 * Loads the coverage inputs — one deployment listing split by `$type` on this side, the platform route
 * listing, and one coverage query — and returns the five cards. Each source is applied as it settles. The inputs are loaded again when the day
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

    void Promise.all([
      apply('deployments', loadDeploymentIds()),
      apply('routes', loadRouteNames()),
      apply('covered', loadCoveredIds(windowStartMs)),
    ]);

    return () => {
      isCancelled = true;
    };
  }, [startOfToday]);

  return useMemo(() => buildCoverageCards(sources), [sources]);
};
