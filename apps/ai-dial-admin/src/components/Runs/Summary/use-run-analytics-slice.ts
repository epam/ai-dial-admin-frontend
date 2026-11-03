'use client';

import { useEffect, useState } from 'react';

import { executeStructuredQuery } from '@/src/app/[lang]/runs/actions';
import { TOTAL_DURATION_ALIAS, TOTAL_METRIC_EVAL_DURATION_ALIAS } from '@/src/components/Runs/Summary/constants';
import { RunAnalyticsSlice } from '@/src/components/Runs/Summary/models';
import {
  buildTestCasesStatusQuery,
  buildTotalMetricEvalDurationQuery,
  buildTotalRunTimeQuery,
  parseDurationMs,
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
      executeStructuredQuery(buildTotalRunTimeQuery(runId)),
      executeStructuredQuery(buildTotalMetricEvalDurationQuery(runId)),
    ]).then(([statusResult, runTimeResult, metricEvalResult]) => {
      if (cancelled) {
        return;
      }
      setData({
        statusCounts: parseTestCaseStatusCounts(statusResult),
        totalRunTimeMs: parseDurationMs(runTimeResult, TOTAL_DURATION_ALIAS),
        totalMetricEvalDurationMs: parseDurationMs(metricEvalResult, TOTAL_METRIC_EVAL_DURATION_ALIAS),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [runId]);

  return { data };
};
