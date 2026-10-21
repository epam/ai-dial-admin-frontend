'use client';

import { useEffect, useState } from 'react';

import { executeStructuredQuery } from '@/src/app/[lang]/runs/actions';
import { AVG_METRIC_EVAL_DURATION_ALIAS } from '@/src/components/Runs/Summary/constants';
import { RunAnalyticsSlice } from '@/src/components/Runs/Summary/models';
import {
  buildAvgMetricEvalDurationQuery,
  buildAvgRunTimeQuery,
  buildTestCasesStatusQuery,
  parseAvgRunTimeMs,
  parseTestCaseStatusCounts,
} from '@/src/components/Runs/Summary/utils';

export const useRunAnalyticsSlice = (runId: string | undefined): { data: RunAnalyticsSlice | null } => {
  const [data, setData] = useState<RunAnalyticsSlice | null>(null);

  useEffect(() => {
    if (!runId) {
      setData(null);
      return;
    }

    let cancelled = false;
    setData(null);

    Promise.all([
      executeStructuredQuery(buildTestCasesStatusQuery(runId)),
      executeStructuredQuery(buildAvgRunTimeQuery(runId)),
      executeStructuredQuery(buildAvgMetricEvalDurationQuery(runId)),
    ]).then(([statusResult, avgResult, avgMetricEvalResult]) => {
      if (cancelled) {
        return;
      }
      setData({
        statusCounts: parseTestCaseStatusCounts(statusResult),
        avgRunTimeMs: parseAvgRunTimeMs(avgResult),
        avgMetricEvalDurationMs: parseAvgRunTimeMs(avgMetricEvalResult, AVG_METRIC_EVAL_DURATION_ALIAS),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [runId]);

  return { data };
};
