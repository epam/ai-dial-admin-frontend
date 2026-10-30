'use client';

import { FC } from 'react';

import { AnalyticsCard, Spinner } from '@epam/ai-dial-ui-kit';

import { isIncompleteRunStatus } from '@/src/components/Common/RunStatus/utils';
import { CompareRunSlot } from '@/src/components/Runs/Compare/constants';
import { getMetricDelta, MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { CompareRun } from '@/src/components/Runs/Compare/models';
import { COMPARE_CARD_BOTTOM_LABEL_CLASS, COMPARE_CARD_CLASS } from '@/src/components/Runs/Compare/Summary/constants';
import { toCompareCardItems, toCompareSideFigures, toRatePercent } from '@/src/components/Runs/Compare/Summary/utils';
import CostValue from '@/src/components/Runs/Summary/Cards/CostValue';
import DeltaBadge from '@/src/components/Runs/Summary/Cards/DeltaBadge';
import ErrorTag from '@/src/components/Runs/Summary/Cards/ErrorTag';
import OverallScoreValue from '@/src/components/Runs/Summary/Cards/OverallScoreValue';
import PassRateValue from '@/src/components/Runs/Summary/Cards/PassRateValue';
import RuntimeValue from '@/src/components/Runs/Summary/Cards/RuntimeValue';
import TestCasesCompletedValue from '@/src/components/Runs/Summary/Cards/TestCasesCompletedValue';
import { RunAnalyticsSlice } from '@/src/components/Runs/Summary/models';
import { useRunAnalyticsSlice } from '@/src/components/Runs/Summary/use-run-analytics-slice';
import { useRunCostState } from '@/src/components/Runs/Summary/use-run-cost-state';
import { formatRunTimeSeconds } from '@/src/components/Runs/Summary/utils';
import { useSourceKindLabel } from '@/src/components/TestSuites/Trends/CostRuntime/use-source-kind-label';
import { formatCostDelta } from '@/src/components/TestSuites/Trends/Kpi/utils/kpi-delta';
import { RunsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  primaryRun: Run;
  comparedRun: Run;
  runs: CompareRun[];
  onlyMatchingTestCases: boolean;
  primaryMatchedAnalytics: RunAnalyticsSlice | null;
  comparedMatchedAnalytics: RunAnalyticsSlice | null;
  primaryOverallScore?: number | null;
  comparedOverallScore?: number | null;
  /** Each run's suite, for the overall-score calculation method; omitted until it has loaded. */
  primaryTestSuite?: TestSuite | null;
  comparedTestSuite?: TestSuite | null;
  /** How many metrics each run computed; omitted while the snapshots are still loading. */
  primaryMetricCount?: number;
  comparedMetricCount?: number;
}

const toDeltaValue = (delta: ReturnType<typeof getMetricDelta>): number | undefined =>
  delta.kind === MetricDeltaKind.Changed ? delta.value : undefined;

const Analytics: FC<Props> = ({
  primaryRun,
  comparedRun,
  runs,
  onlyMatchingTestCases,
  primaryMatchedAnalytics,
  comparedMatchedAnalytics,
  primaryOverallScore,
  comparedOverallScore,
  primaryTestSuite,
  comparedTestSuite,
  primaryMetricCount,
  comparedMetricCount,
}) => {
  const t = useI18n();
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

  if (!primary || !compared) {
    return (
      <div className="flex h-24 items-center">
        <Spinner size={32} fullWidth />
      </div>
    );
  }

  const figures = {
    [CompareRunSlot.Primary]: toCompareSideFigures(primaryRun, primary),
    [CompareRunSlot.Secondary]: toCompareSideFigures(comparedRun, compared),
  };
  const sourceLabels = {
    [CompareRunSlot.Primary]: primarySourceLabel,
    [CompareRunSlot.Secondary]: comparedSourceLabel,
  };
  const costs = { [CompareRunSlot.Primary]: primaryCost, [CompareRunSlot.Secondary]: comparedCost };
  const runsBySlot = { [CompareRunSlot.Primary]: primaryRun, [CompareRunSlot.Secondary]: comparedRun };
  const scores = {
    [CompareRunSlot.Primary]: primaryOverallScore ?? null,
    [CompareRunSlot.Secondary]: comparedOverallScore ?? null,
  };
  const suites = { [CompareRunSlot.Primary]: primaryTestSuite, [CompareRunSlot.Secondary]: comparedTestSuite };
  const metricCounts = {
    [CompareRunSlot.Primary]: primaryMetricCount,
    [CompareRunSlot.Secondary]: comparedMetricCount,
  };
  const primaryFigures = figures[CompareRunSlot.Primary];
  const comparedFigures = figures[CompareRunSlot.Secondary];

  const hasEitherThreshold = primaryFigures.hasThreshold || comparedFigures.hasThreshold;
  const hasMixedThresholds = primaryFigures.hasThreshold !== comparedFigures.hasThreshold;
  const rateTitle = t(hasEitherThreshold ? RunsI18nKey.ThresholdPassRate : RunsI18nKey.CompletionRate);
  // A run without a threshold has no pass rate to set beside the other run's, so it shows a dash.
  const rateOf = (slot: CompareRunSlot) =>
    hasMixedThresholds && !figures[slot].hasThreshold ? null : figures[slot].rate;

  const completedDelta = getMetricDelta(
    primaryFigures.breakdown.total > 0 ? primaryFigures.breakdown.completed : null,
    comparedFigures.breakdown.total > 0 ? comparedFigures.breakdown.completed : null,
  );
  const rateDelta = hasMixedThresholds
    ? null
    : getMetricDelta(toRatePercent(primaryFigures.rate), toRatePercent(comparedFigures.rate));
  const overallDelta = getMetricDelta(scores[CompareRunSlot.Primary], scores[CompareRunSlot.Secondary]);
  const primaryRuntimeSeconds = primaryFigures.totalMs != null ? formatRunTimeSeconds(primaryFigures.totalMs) : null;
  const comparedRuntimeSeconds = comparedFigures.totalMs != null ? formatRunTimeSeconds(comparedFigures.totalMs) : null;
  const runtimeDelta = getMetricDelta(primaryRuntimeSeconds, comparedRuntimeSeconds);

  // `formatCostDelta(latest, previous)` is latest − previous: the second run minus the baseline.
  const isCostDeltaAvailable = [primaryCost, comparedCost].every((cost) => !cost.isPending && !cost.hasError);
  const costDeltaLabel = isCostDeltaAvailable ? formatCostDelta(comparedCost.totalCost, primaryCost.totalCost) : null;

  const hasNoTestCases = primaryFigures.breakdown.total === 0 && comparedFigures.breakdown.total === 0;
  const hasRuntimeError = (slot: CompareRunSlot) =>
    figures[slot].totalMs == null && !isIncompleteRunStatus(runsBySlot[slot].status);
  const hasBothRuntimeErrors = hasRuntimeError(CompareRunSlot.Primary) && hasRuntimeError(CompareRunSlot.Secondary);
  const hasBothCostErrors = primaryCost.hasError && comparedCost.hasError;
  const showOverall = primaryOverallScore != null || comparedOverallScore != null;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
      <AnalyticsCard
        className={COMPARE_CARD_CLASS}
        title={t(RunsI18nKey.TestCasesCompleted)}
        delta={toDeltaValue(completedDelta)}
        compareValues={toCompareCardItems(runs, (run) => (
          <TestCasesCompletedValue
            breakdown={figures[run.slot].breakdown}
            hasThreshold={figures[run.slot].hasThreshold}
            tooltipTitle={run.name}
          />
        ))}
        error={hasNoTestCases}
      />
      <AnalyticsCard
        className={COMPARE_CARD_CLASS}
        title={rateTitle}
        delta={rateDelta ? toDeltaValue(rateDelta) : undefined}
        deltaUnit="%"
        compareValues={toCompareCardItems(runs, (run) => (
          <PassRateValue
            rate={rateOf(run.slot)}
            threshold={figures[run.slot].threshold}
            label={`${rateTitle}: ${run.name}`}
          />
        ))}
        error={hasNoTestCases}
      />
      {showOverall && (
        <AnalyticsCard
          className={COMPARE_CARD_BOTTOM_LABEL_CLASS}
          title={t(RunsI18nKey.OverallScore)}
          description={t(TestSuitesI18nKey.TrendsBasedOnCompletedStatic)}
          delta={toDeltaValue(overallDelta)}
          compareValues={toCompareCardItems(runs, (run) => (
            <OverallScoreValue
              score={scores[run.slot]}
              threshold={figures[run.slot].threshold}
              isInfoInline
              testSuite={suites[run.slot]}
              metricCount={metricCounts[run.slot]}
            />
          ))}
        />
      )}
      <AnalyticsCard
        className={COMPARE_CARD_CLASS}
        title={t(RunsI18nKey.TotalRuntime)}
        delta={toDeltaValue(runtimeDelta)}
        deltaPositive={runtimeDelta.value != null && runtimeDelta.value < 0}
        deltaUnit={t(RunsI18nKey.Seconds)}
        compareValues={toCompareCardItems(runs, (run) =>
          hasRuntimeError(run.slot) ? (
            <ErrorTag />
          ) : (
            <RuntimeValue
              sourceMs={figures[run.slot].sourceMs}
              metricsMs={figures[run.slot].metricsMs}
              sourceLabel={sourceLabels[run.slot]}
            />
          ),
        )}
        error={hasBothRuntimeErrors}
      />
      <AnalyticsCard
        className={COMPARE_CARD_CLASS}
        title={
          <span className="flex items-center gap-2">
            <span>{t(RunsI18nKey.TotalRunCost)}</span>
            {costDeltaLabel != null && (
              <DeltaBadge label={costDeltaLabel} isPositive={costDeltaLabel.startsWith('-')} />
            )}
          </span>
        }
        compareValues={toCompareCardItems(runs, (run) =>
          costs[run.slot].hasError ? (
            <ErrorTag />
          ) : (
            <CostValue cost={costs[run.slot]} sourceLabel={sourceLabels[run.slot]} />
          ),
        )}
        error={hasBothCostErrors}
      />
    </div>
  );
};

export default Analytics;
