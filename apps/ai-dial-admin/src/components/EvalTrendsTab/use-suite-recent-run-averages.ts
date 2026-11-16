'use client';

import { useEffect, useMemo, useState } from 'react';

import { getSuiteRecentRunAverages } from '@/src/app/[lang]/test-suites/actions';
import { SuiteRecentRunAverage } from '@/src/components/EvalTrendsTab/suite-recent-run-averages';

export interface SuiteRecentRunAveragesState {
  averagesBySuiteId: Record<string, SuiteRecentRunAverage>;
  isLoading: boolean;
}

export const useSuiteRecentRunAverages = (suiteIds: string[]): SuiteRecentRunAveragesState => {
  const suiteIdsKey = useMemo(() => [...suiteIds].sort().join(','), [suiteIds]);
  const [averagesBySuiteId, setAveragesBySuiteId] = useState<Record<string, SuiteRecentRunAverage>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const ids = suiteIdsKey ? suiteIdsKey.split(',') : [];
    if (ids.length === 0) {
      setAveragesBySuiteId({});
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const load = async () => {
      try {
        const rows = await getSuiteRecentRunAverages(ids);
        if (cancelled) {
          return;
        }
        const next: Record<string, SuiteRecentRunAverage> = {};
        for (const row of rows) {
          next[row.suiteId] = row;
        }
        setAveragesBySuiteId(next);
      } catch {
        if (!cancelled) {
          setAveragesBySuiteId({});
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
  }, [suiteIdsKey]);

  return { averagesBySuiteId, isLoading };
};
