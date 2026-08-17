'use client';

import { useEffect, useState } from 'react';

import { executeStructuredQuery } from '@/src/app/[lang]/runs/actions';
import { getRuns } from '@/src/app/[lang]/test-suites/actions';
import { RUN_FILTER } from '@/src/components/TestSuites/Runs/constants';
import { TrendsData } from '@/src/components/TestSuites/Trends/models';
import { buildTrendsMetricScoresQuery } from '@/src/components/TestSuites/Trends/utils/build-trends-query';
import { emptyTrendsData, parseTrendsData } from '@/src/components/TestSuites/Trends/utils/parse-trends';
import { Run } from '@/src/models/evaluation/run';
import { EvaluationPageData } from '@/src/models/request';

interface TrendsDataState {
  data: TrendsData | null;
  isLoading: boolean;
}

export const useTrendsData = (suiteId: string | undefined): TrendsDataState => {
  const [data, setData] = useState<TrendsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!suiteId) {
      setData(emptyTrendsData());
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const load = async () => {
      try {
        const [scoreResult, runsPage] = await Promise.all([
          executeStructuredQuery(buildTrendsMetricScoresQuery(suiteId)),
          getRuns(0, 100, [], [RUN_FILTER(suiteId)]),
        ]);

        if (cancelled) {
          return;
        }

        const runs = ((runsPage as EvaluationPageData<Run> | null)?.content ?? []) as Run[];
        setData(parseTrendsData(scoreResult, runs));
      } catch {
        if (!cancelled) {
          setData(emptyTrendsData());
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
  }, [suiteId]);

  return { data, isLoading };
};
