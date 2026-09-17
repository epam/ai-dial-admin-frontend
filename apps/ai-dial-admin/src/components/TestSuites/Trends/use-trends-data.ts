'use client';

import { useEffect, useState } from 'react';

import { executeStructuredQuery, getTestCasePassRate } from '@/src/app/[lang]/runs/actions';
import { getRuns } from '@/src/app/[lang]/test-suites/actions';
import { RUN_FILTER } from '@/src/components/TestSuites/Runs/constants';
import { buildCasePassRateSeries } from '@/src/components/TestSuites/Trends/CasePassRate/utils/case-pass-rate';
import { TRENDS_RUN_WINDOW } from '@/src/components/TestSuites/Trends/constants';
import { TrendsData } from '@/src/components/TestSuites/Trends/models';
import { buildTrendsMetricScoresQuery } from '@/src/components/TestSuites/Trends/utils/build-trends-query';
import { emptyTrendsData, parseTrendsData } from '@/src/components/TestSuites/Trends/utils/parse-trends';
import { CasePassRateResponse } from '@/src/models/evaluation/case-pass-rate';
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

    /**
     * Resolves rather than rejects, so a case-pass-rate failure degrades to the panel's unavailable
     * state instead of dropping the whole tab into `emptyTrendsData()`. `buildCasePassRateSeries`
     * covers the other half of that boundary — a response of an unexpected shape.
     */
    const loadCasePassRate = async (): Promise<CasePassRateResponse | null> => {
      try {
        return await getTestCasePassRate(suiteId, TRENDS_RUN_WINDOW);
      } catch {
        return null;
      }
    };

    const load = async () => {
      try {
        const [scoreResult, runsPage, casePassRate] = await Promise.all([
          executeStructuredQuery(buildTrendsMetricScoresQuery(suiteId)),
          getRuns(0, 100, [], [RUN_FILTER(suiteId)]),
          loadCasePassRate(),
        ]);

        if (cancelled) {
          return;
        }

        const runs = ((runsPage as EvaluationPageData<Run> | null)?.content ?? []) as Run[];
        setData(parseTrendsData(scoreResult, runs, buildCasePassRateSeries(casePassRate, runs)));
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
