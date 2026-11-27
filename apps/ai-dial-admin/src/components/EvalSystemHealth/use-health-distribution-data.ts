'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { getHealthDistribution } from '@/src/app/[lang]/runs/actions';
import { CoverageStatus, HealthDistributionData } from '@/src/components/EvalSystemHealth/models';
import { buildHealthDistributionBars } from '@/src/components/EvalSystemHealth/utils/build-health-distribution-bars';
import { HealthDistribution } from '@/src/models/evaluation/health-distribution';

interface LoadState {
  status: CoverageStatus;
  data: HealthDistribution | null;
}

const LOADING: LoadState = { status: CoverageStatus.Loading, data: null };
const FAILED: LoadState = { status: CoverageStatus.Error, data: null };

/** Never rejects: a request that cannot be read is reported as `null`, the API's own way of reporting a failure. */
const loadDistribution = async (weeks: number, threshold: number): Promise<HealthDistribution | null> => {
  try {
    return await getHealthDistribution(weeks, threshold);
  } catch {
    return null;
  }
};

/**
 * Loads the weekly health distribution for `weeks` weeks at `threshold` (a fraction of 1), and again whenever
 * either changes or on retry. A response a newer request has superseded is dropped.
 */
export const useHealthDistributionData = (weeks: number, threshold: number): HealthDistributionData => {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>(LOADING);

  useEffect(() => {
    let isCancelled = false;

    setState(LOADING);
    const load = async () => {
      const result = await loadDistribution(weeks, threshold);
      if (isCancelled) {
        return;
      }
      setState(result == null ? FAILED : { status: CoverageStatus.Ready, data: result });
    };
    void load();

    return () => {
      isCancelled = true;
    };
  }, [attempt, weeks, threshold]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  const bars = useMemo(() => buildHealthDistributionBars(state.data?.weeks ?? []), [state.data]);

  return {
    status: state.status,
    bars,
    threshold: state.data?.threshold ?? threshold,
    isEmpty: state.status === CoverageStatus.Ready && bars.every((bar) => bar.suiteCount === 0),
    retry,
  };
};
