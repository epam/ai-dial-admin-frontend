'use client';

import { useEffect, useState } from 'react';

import { executeStructuredQuery } from '@/src/app/[lang]/runs/actions';
import { RunAnalyticsSlice } from '@/src/components/Runs/Summary/models';
import {
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
    ]).then(([statusResult, avgResult]) => {
      if (cancelled) {
        return;
      }
      setData({
        statusCounts: parseTestCaseStatusCounts(statusResult),
        avgRunTimeMs: parseAvgRunTimeMs(avgResult),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [runId]);

  return { data };
};
