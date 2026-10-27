'use client';

import { useEffect, useState } from 'react';

import { executeStructuredQuery } from '@/src/app/[lang]/runs/actions';
import { hasOverallScoreThreshold } from '@/src/components/Runs/Summary/utils';
import { RunTestCaseSegments, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { buildTrendsTestCasesEvalQuery } from '@/src/components/TestSuites/Trends/TestCases/utils/build-test-cases-eval-query';
import { parseTestCasesEvalResult } from '@/src/components/TestSuites/Trends/TestCases/utils/parse-test-cases-eval';

interface TestCasesEvalDataState {
  segments: RunTestCaseSegments[];
  isLoading: boolean;
  hasError: boolean;
}

export const useTestCasesEvalData = (
  runOrder: TrendsRunPoint[],
  overallScoreThreshold?: number | null,
): TestCasesEvalDataState => {
  const [segments, setSegments] = useState<RunTestCaseSegments[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const runIdsKey = runOrder.map((point) => point.runId).join(',');
  const hasThreshold = hasOverallScoreThreshold(overallScoreThreshold);

  useEffect(() => {
    if (!runOrder.length) {
      setSegments([]);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    let cancelled = false;
    setSegments([]);
    setIsLoading(true);
    setHasError(false);

    const load = async () => {
      try {
        const result = await executeStructuredQuery(
          buildTrendsTestCasesEvalQuery(runOrder.map((point) => point.runId)),
        );
        if (cancelled) {
          return;
        }
        const parsed = parseTestCasesEvalResult(result, runOrder, hasThreshold, overallScoreThreshold);
        setSegments(parsed.segments);
      } catch {
        if (!cancelled) {
          setSegments([]);
          setHasError(true);
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
  }, [runIdsKey, overallScoreThreshold, hasThreshold]); // eslint-disable-line react-hooks/exhaustive-deps -- runOrder captured when runIdsKey changes

  return { segments, isLoading, hasError };
};
