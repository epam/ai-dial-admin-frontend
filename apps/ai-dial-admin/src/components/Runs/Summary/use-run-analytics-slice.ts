'use client';

import { useEffect, useState } from 'react';

import { executeStructuredQuery } from '@/src/app/[lang]/runs/actions';
import { TOTAL_DURATION_ALIAS, TOTAL_METRIC_EVAL_DURATION_ALIAS } from '@/src/components/Runs/Summary/constants';
import { RunAnalyticsSlice } from '@/src/components/Runs/Summary/models';
import { loadTestCaseStatusCounts } from '@/src/components/Runs/Summary/load-test-case-status-counts';
import {
  buildTotalMetricEvalDurationQuery,
  buildTotalRunTimeQuery,
  parseDurationMs,
} from '@/src/components/Runs/Summary/utils';

/**
 * A run's analytics slice. `testCaseCount` is the run's reported number of test cases; pass it only for a
 * finished run (see `loadTestCaseStatusCounts`).
 */
export const useRunAnalyticsSlice = (
  runId: string | undefined,
  testCaseCount?: number,
): { data: RunAnalyticsSlice | null } => {
  const [data, setData] = useState<RunAnalyticsSlice | null>(null);

  useEffect(() => {
    if (!runId) {
      setData(null);
      return;
    }

    let cancelled = false;
    setData(null);

    Promise.all([
      loadTestCaseStatusCounts({ runId, testCaseCount }),
      executeStructuredQuery(buildTotalRunTimeQuery(runId)),
      executeStructuredQuery(buildTotalMetricEvalDurationQuery(runId)),
    ]).then(([status, runTimeResult, metricEvalResult]) => {
      if (cancelled) {
        return;
      }
      setData({
        statusCounts: status.counts,
        hasScoreRows: status.hasScoreRows,
        totalRunTimeMs: parseDurationMs(runTimeResult, TOTAL_DURATION_ALIAS),
        totalMetricEvalDurationMs: parseDurationMs(metricEvalResult, TOTAL_METRIC_EVAL_DURATION_ALIAS),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [runId, testCaseCount]);

  return { data };
};
