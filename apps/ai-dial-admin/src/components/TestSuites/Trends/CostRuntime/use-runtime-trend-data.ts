'use client';

import { useEffect, useState } from 'react';

import { executeStructuredQuery } from '@/src/app/[lang]/runs/actions';
import { ComboTrendPoint, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { buildTrendsRuntimeQuery } from '@/src/components/TestSuites/Trends/CostRuntime/utils/build-runtime-query';
import { parseTrendsRuntimeResult } from '@/src/components/TestSuites/Trends/CostRuntime/utils/parse-runtime';

interface RuntimeTrendDataState {
  points: ComboTrendPoint[];
  isLoading: boolean;
}

export const useRuntimeTrendData = (runOrder: TrendsRunPoint[]): RuntimeTrendDataState => {
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
      try {
        const result = await executeStructuredQuery(buildTrendsRuntimeQuery(runOrder.map((point) => point.runId)));
        if (cancelled) {
          return;
        }
        setPoints(parseTrendsRuntimeResult(result, runOrder));
      } catch {
        if (!cancelled) {
          setPoints(parseTrendsRuntimeResult(null, runOrder));
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
  }, [runIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps -- runOrder captured when runIdsKey changes

  return { points, isLoading };
};
