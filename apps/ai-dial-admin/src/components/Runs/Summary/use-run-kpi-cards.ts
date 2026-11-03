'use client';

import { useMemo } from 'react';

import { isIncompleteRunStatus } from '@/src/components/Common/RunStatus/utils';
import { RunKpiFigures } from '@/src/components/Runs/Summary/models';
import { useRunAnalyticsSlice } from '@/src/components/Runs/Summary/use-run-analytics-slice';
import { RunCostState, useRunCostState } from '@/src/components/Runs/Summary/use-run-cost-state';
import { toRunKpiFigures } from '@/src/components/Runs/Summary/utils';
import { useSourceKindLabel } from '@/src/components/TestSuites/Trends/CostRuntime/use-source-kind-label';
import { RunsI18nKey } from '@/src/constants/i18n';
import { Run } from '@/src/models/evaluation/run';

interface Params {
  run: Run;
  /** How many metrics the run computed; omitted while the snapshots are still loading. */
  metricSnapshotCount?: number;
}

export interface RunKpiCards {
  figures: RunKpiFigures;
  sourceLabel: string;
  cost: RunCostState;
  rateTitleKey: RunsI18nKey;
  hasNoTestCases: boolean;
  hasRuntimeError: boolean;
}

/**
 * Everything the Run Summary KPI strip renders for one run — figures, source label, cost state and the
 * Error flags — or null while the run's analytics slice is still loading.
 */
export const useRunKpiCards = ({ run, metricSnapshotCount }: Params): RunKpiCards | null => {
  const { data } = useRunAnalyticsSlice(run?.id);
  const sourceLabel = useSourceKindLabel(run?.suiteSnapshot ?? {});
  const cost = useRunCostState({
    run,
    hasNoResults: data != null && data.totalRunTimeMs == null,
    metricSnapshotCount,
  });
  const figures = useMemo(() => (data ? toRunKpiFigures(run, data) : null), [run, data]);

  if (!figures) {
    return null;
  }

  // Incomplete statuses (incl. CANCELLED/FAILED) never Error a card — missing figures are a dash.
  const isRunIncomplete = isIncompleteRunStatus(run.status);

  return {
    figures,
    sourceLabel,
    cost,
    rateTitleKey: figures.hasThreshold ? RunsI18nKey.ThresholdPassRate : RunsI18nKey.CompletionRate,
    hasNoTestCases: figures.breakdown.total === 0 && !isRunIncomplete,
    hasRuntimeError: figures.totalMs == null && !isRunIncomplete,
  };
};
