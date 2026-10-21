'use client';

import { useEffect, useState } from 'react';

import { executeStructuredQuery } from '@/src/app/[lang]/runs/actions';
import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { buildTrendsStabilityQuery } from '@/src/components/TestSuites/Trends/utils/build-stability-query';
import {
  pivotStabilitySummaries,
  StabilityMatrix,
  StabilitySummaryRow,
} from '@/src/components/TestSuites/Trends/utils/pivot-stability';
import { StructuredQueryResult } from '@/src/models/evaluation/structured-query';

interface StabilityDataState {
  matrix: StabilityMatrix | null;
  isLoading: boolean;
  hasError: boolean;
}

const emptyMatrix = (): StabilityMatrix => ({
  rows: [],
  cellMeta: {},
  headerLabels: [],
  testCaseColIds: [],
});

export const useTestCaseStabilityData = (runOrder: TrendsRunPoint[] | undefined): StabilityDataState => {
  const [matrix, setMatrix] = useState<StabilityMatrix | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const runIdsKey = (runOrder ?? []).map((run) => run.runId).join(',');

  useEffect(() => {
    const runs = runOrder ?? [];
    if (!runs.length) {
      setMatrix(null);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setHasError(false);

    const load = async () => {
      try {
        const result = (await executeStructuredQuery(
          buildTrendsStabilityQuery(runs.map((run) => run.runId)),
        )) as StructuredQueryResult | null;
        if (cancelled) {
          return;
        }
        const rows = (result?.rows ?? []) as StabilitySummaryRow[];
        setMatrix(pivotStabilitySummaries(rows, runs));
      } catch {
        if (!cancelled) {
          setMatrix(emptyMatrix());
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
  }, [runIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps -- runOrder captured when runIdsKey changes

  return { matrix, isLoading, hasError };
};
