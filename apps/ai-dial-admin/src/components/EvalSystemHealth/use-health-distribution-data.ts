'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { getHealthDistribution } from '@/src/app/[lang]/runs/actions';
import { HEALTH_DISTRIBUTION_THRESHOLD, HEALTH_DISTRIBUTION_WEEKS } from '@/src/components/EvalSystemHealth/constants';
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
const loadDistribution = async (): Promise<HealthDistribution | null> => {
  try {
    return await getHealthDistribution(HEALTH_DISTRIBUTION_WEEKS, HEALTH_DISTRIBUTION_THRESHOLD);
  } catch {
    return null;
  }
};

/** Loads the weekly health distribution once, and again on retry. A response a retry has superseded is dropped. */
export const useHealthDistributionData = (): HealthDistributionData => {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<LoadState>(LOADING);

  useEffect(() => {
    let isCancelled = false;

    setState(LOADING);
    const load = async () => {
      const result = await loadDistribution();
      if (isCancelled) {
        return;
      }
      setState(result == null ? FAILED : { status: CoverageStatus.Ready, data: result });
    };
    void load();

    return () => {
      isCancelled = true;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((current) => current + 1), []);

  const bars = useMemo(() => buildHealthDistributionBars(state.data?.weeks ?? []), [state.data]);

  return {
    status: state.status,
    bars,
    threshold: state.data?.threshold ?? HEALTH_DISTRIBUTION_THRESHOLD,
    isEmpty: state.status === CoverageStatus.Ready && bars.every((bar) => bar.suiteCount === 0),
    retry,
  };
};
