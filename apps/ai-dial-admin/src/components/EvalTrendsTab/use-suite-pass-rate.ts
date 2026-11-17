'use client';

import { useEffect, useMemo, useState } from 'react';

import { getSuitePassRate } from '@/src/app/[lang]/test-suites/actions';
import { EMPTY_SUITE_PASS_RATE_SUMMARY, SuitePassRateSummary } from '@/src/components/EvalTrendsTab/suite-pass-rate';

export interface SuitePassRateState {
  summary: SuitePassRateSummary;
  isLoading: boolean;
}

export const useSuitePassRate = (suiteIds: string[]): SuitePassRateState => {
  const suiteIdsKey = useMemo(() => [...suiteIds].sort().join(','), [suiteIds]);
  const [summary, setSummary] = useState<SuitePassRateSummary>({ ...EMPTY_SUITE_PASS_RATE_SUMMARY });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const ids = suiteIdsKey ? suiteIdsKey.split(',') : [];
    if (ids.length === 0) {
      setSummary({ ...EMPTY_SUITE_PASS_RATE_SUMMARY });
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const load = async () => {
      try {
        const next = await getSuitePassRate(ids);
        if (!cancelled) {
          setSummary(next);
        }
      } catch {
        if (!cancelled) {
          setSummary({ ...EMPTY_SUITE_PASS_RATE_SUMMARY });
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

  return { summary, isLoading };
};
