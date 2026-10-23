'use client';

import { useEffect, useState } from 'react';

import { getRunsTotalCosts } from '@/src/app/[lang]/runs/actions';
import { parseTrendsCostPoints } from '@/src/components/TestSuites/Trends/CostRuntime/utils/parse-cost';
import { ComboTrendPoint, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { RunTotalCosts } from '@/src/models/evaluation/run';

interface CostTrendDataState {
  points: ComboTrendPoint[];
  isLoading: boolean;
}

export const useCostTrendData = (runOrder: TrendsRunPoint[]): CostTrendDataState => {
  const [points, setPoints] = useState<ComboTrendPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const runIdsKey = runOrder.map((point) => point.runId).join(',');

  useEffect(() => {
    if (!runOrder.length) {
      setPoints([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setPoints([]);
    setIsLoading(true);

    const load = async () => {
      const results = await getRunsTotalCosts(runOrder.map((point) => point.runId));
      if (cancelled || !results) {
        return;
      }

      const costsByRunId: Record<string, RunTotalCosts | null> = results.reduce(
        (acc, result) => {
          acc[result.runId] = result;
          return acc;
        },
        {} as Record<string, RunTotalCosts | null>,
      );
      setPoints(parseTrendsCostPoints(runOrder, costsByRunId));
      setIsLoading(false);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [runIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps -- runOrder captured when runIdsKey changes

  return { points, isLoading };
};
