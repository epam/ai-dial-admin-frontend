'use client';

import { useEffect, useMemo, useState } from 'react';

import { getDeploymentPeriodCosts } from '@/src/app/[lang]/test-suites/actions';
import {
  buildMonthCostWindows,
  MonthCostWindows,
  sumDeploymentCostParts,
} from '@/src/components/EntityView/EvalTrends/deployment-month-cost';

export interface DeploymentMonthCostsState {
  windows: MonthCostWindows;
  currentTotal: number | null;
  previousTotal: number | null;
  isLoading: boolean;
}

export const useDeploymentMonthCosts = (deploymentId: string | undefined): DeploymentMonthCostsState => {
  const windows = useMemo(() => buildMonthCostWindows(new Date()), []);
  const [currentTotal, setCurrentTotal] = useState<number | null>(null);
  const [previousTotal, setPreviousTotal] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!deploymentId) {
      setCurrentTotal(null);
      setPreviousTotal(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const load = async () => {
      try {
        const result = await getDeploymentPeriodCosts(
          deploymentId,
          windows.current.fromMs,
          windows.current.toMs,
          windows.previous.fromMs,
          windows.previous.toMs,
        );
        if (!cancelled) {
          setCurrentTotal(sumDeploymentCostParts(result.current));
          setPreviousTotal(sumDeploymentCostParts(result.previous));
        }
      } catch {
        if (!cancelled) {
          setCurrentTotal(null);
          setPreviousTotal(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [deploymentId, windows]);

  return { windows, currentTotal, previousTotal, isLoading };
};
