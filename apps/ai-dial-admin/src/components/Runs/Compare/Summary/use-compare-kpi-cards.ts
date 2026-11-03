'use client';

import { useMemo } from 'react';

import { isIncompleteRunStatus } from '@/src/components/Common/RunStatus/utils';
import { CompareRunSlot } from '@/src/components/Runs/Compare/constants';
import { getMetricDelta } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { CompareKpiCards } from '@/src/components/Runs/Compare/Summary/models';
import { toRatePercent, toSlotRecord } from '@/src/components/Runs/Compare/Summary/utils';
import { RunAnalyticsSlice } from '@/src/components/Runs/Summary/models';
import { useRunAnalyticsSlice } from '@/src/components/Runs/Summary/use-run-analytics-slice';
import { useRunCostState } from '@/src/components/Runs/Summary/use-run-cost-state';
import { formatRunTimeSeconds, toRunKpiFigures } from '@/src/components/Runs/Summary/utils';
import { useSourceKindLabel } from '@/src/components/TestSuites/Trends/CostRuntime/use-source-kind-label';
import { formatCostDelta } from '@/src/components/TestSuites/Trends/Kpi/utils/kpi-delta';
import { RunsI18nKey } from '@/src/constants/i18n';
import { Run } from '@/src/models/evaluation/run';

interface Params {
  primaryRun: Run;
  comparedRun: Run;
  onlyMatchingTestCases: boolean;
  primaryMatchedAnalytics: RunAnalyticsSlice | null;
  comparedMatchedAnalytics: RunAnalyticsSlice | null;
  primaryOverallScore?: number | null;
  comparedOverallScore?: number | null;
  /** How many metrics each run computed; omitted while the snapshots are still loading. */
  primaryMetricCount?: number;
  comparedMetricCount?: number;
}

/**
 * Everything the Run Comparison Summary KPI cards render, derived once from both runs — per-run figures,
 * source labels, cost states, rates, diffs (second run minus baseline) and Error flags — or null while
 * either run's analytics are still loading.
 */
export const useCompareKpiCards = ({
  primaryRun,
  comparedRun,
  onlyMatchingTestCases,
  primaryMatchedAnalytics,
  comparedMatchedAnalytics,
  primaryOverallScore,
  comparedOverallScore,
  primaryMetricCount,
  comparedMetricCount,
}: Params): CompareKpiCards | null => {
  const { data: primaryFull } = useRunAnalyticsSlice(onlyMatchingTestCases ? undefined : primaryRun.id);
  const { data: comparedFull } = useRunAnalyticsSlice(onlyMatchingTestCases ? undefined : comparedRun.id);
  const primary = onlyMatchingTestCases ? primaryMatchedAnalytics : primaryFull;
  const compared = onlyMatchingTestCases ? comparedMatchedAnalytics : comparedFull;

  const primarySourceLabel = useSourceKindLabel(primaryRun.suiteSnapshot ?? {});
  const comparedSourceLabel = useSourceKindLabel(comparedRun.suiteSnapshot ?? {});
  // Cost is aggregated per run, so it never follows the matching-only toggle — and the matched runtime
  // being absent says nothing about whether the whole run has results, so only full-run slices feed the
  // "no results" Error.
  const primaryCost = useRunCostState({
    run: primaryRun,
    hasNoResults: !onlyMatchingTestCases && primary != null && primary.totalRunTimeMs == null,
    metricSnapshotCount: primaryMetricCount,
  });
  const comparedCost = useRunCostState({
    run: comparedRun,
    hasNoResults: !onlyMatchingTestCases && compared != null && compared.totalRunTimeMs == null,
    metricSnapshotCount: comparedMetricCount,
  });

  const primaryFigures = useMemo(() => (primary ? toRunKpiFigures(primaryRun, primary) : null), [primaryRun, primary]);
  const comparedFigures = useMemo(
    () => (compared ? toRunKpiFigures(comparedRun, compared) : null),
    [comparedRun, compared],
  );

  if (!primaryFigures || !comparedFigures) {
    return null;
  }

  const hasMixedThresholds = primaryFigures.hasThreshold !== comparedFigures.hasThreshold;
  // A run without a threshold has no pass rate to set beside the other run's, so it shows a dash.
  const rateOf = (figures: typeof primaryFigures) =>
    hasMixedThresholds && !figures.hasThreshold ? null : figures.rate;

  const isCostDeltaAvailable = [primaryCost, comparedCost].every((cost) => !cost.isPending && !cost.hasError);
  const hasRuntimeError = (totalMs: number | null, run: Run) => totalMs == null && !isIncompleteRunStatus(run.status);
  const runtimeErrors = toSlotRecord(
    hasRuntimeError(primaryFigures.totalMs, primaryRun),
    hasRuntimeError(comparedFigures.totalMs, comparedRun),
  );

  return {
    figures: toSlotRecord(primaryFigures, comparedFigures),
    sourceLabels: toSlotRecord(primarySourceLabel, comparedSourceLabel),
    costs: toSlotRecord(primaryCost, comparedCost),
    rates: toSlotRecord(rateOf(primaryFigures), rateOf(comparedFigures)),
    rateTitleKey:
      primaryFigures.hasThreshold || comparedFigures.hasThreshold
        ? RunsI18nKey.ThresholdPassRate
        : RunsI18nKey.CompletionRate,
    deltas: {
      completed: getMetricDelta(
        primaryFigures.breakdown.total > 0 ? primaryFigures.breakdown.completed : null,
        comparedFigures.breakdown.total > 0 ? comparedFigures.breakdown.completed : null,
      ),
      rate: hasMixedThresholds
        ? null
        : getMetricDelta(toRatePercent(primaryFigures.rate), toRatePercent(comparedFigures.rate)),
      overallScore: getMetricDelta(primaryOverallScore ?? null, comparedOverallScore ?? null),
      runtime: getMetricDelta(
        primaryFigures.totalMs != null ? formatRunTimeSeconds(primaryFigures.totalMs) : null,
        comparedFigures.totalMs != null ? formatRunTimeSeconds(comparedFigures.totalMs) : null,
      ),
      // `formatCostDelta(latest, previous)` is latest − previous: the second run minus the baseline.
      costLabel: isCostDeltaAvailable ? formatCostDelta(comparedCost.totalCost, primaryCost.totalCost) : null,
    },
    hasNoTestCases: primaryFigures.breakdown.total === 0 && comparedFigures.breakdown.total === 0,
    hasRuntimeError: runtimeErrors,
    hasBothRuntimeErrors: runtimeErrors[CompareRunSlot.Primary] && runtimeErrors[CompareRunSlot.Secondary],
    hasBothCostErrors: primaryCost.hasError && comparedCost.hasError,
    hasOverallScore: primaryOverallScore != null || comparedOverallScore != null,
  };
};
