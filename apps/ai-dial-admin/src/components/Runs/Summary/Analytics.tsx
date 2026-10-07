'use client';

import { FC, ReactNode } from 'react';

import { DialAnalyticsCard, DialLoader } from '@epam/ai-dial-ui-kit';

import PassFailFraction from '@/src/components/Common/PassFailStatus/PassFailFraction';
import PassFailStatusBreakdown from '@/src/components/Common/PassFailStatus/PassFailStatusBreakdown';
import { isIncompleteRunStatus, isTransitionalRunStatus } from '@/src/components/Common/RunStatus/utils';
import { ANALYTICS_KPI_CARD_CLASS, ANALYTICS_KPI_GRID_CLASS } from '@/src/components/Runs/Summary/constants';
import { useDeploymentType } from '@/src/components/Runs/Summary/use-deployment-type';
import { useModelPricing } from '@/src/components/Runs/Summary/use-model-pricing';
import { useRunAnalyticsSlice } from '@/src/components/Runs/Summary/use-run-analytics-slice';
import { useRunCosts } from '@/src/components/Runs/Summary/use-run-costs';
import { formatAvgRunTimeSeconds, formatRunCost, hasOverallScoreThreshold } from '@/src/components/Runs/Summary/utils';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { SuiteType } from '@/src/models/evaluation/test-suite';
import classNames from 'classnames';

const NO_DATA_VALUE = '—';

interface Props {
  run: Run;
  /** Run-level overall score from metric scores data; omitted while loading, null when absent. */
  overallScore?: number | null;
  /** How many metrics the run computed; omitted while the snapshots are still loading. */
  metricSnapshotCount?: number;
}

const CostCalculatingValue: FC<{ label: string }> = ({ label }) => (
  <div className="flex flex-col justify-center">
    <span className="p-1 rounded bg-layer-4 dial-small-text text-secondary w-fit" role="status">
      {label}
    </span>
  </div>
);

const getCardClassNames = (error?: boolean) =>
  classNames(ANALYTICS_KPI_CARD_CLASS, {
    'justify-start gap-2': !!error,
  });

const Analytics: FC<Props> = ({ run, overallScore, metricSnapshotCount }) => {
  const t = useI18n();
  const { data } = useRunAnalyticsSlice(run?.id);

  const isRunInProgress = isTransitionalRunStatus(run?.status);
  // Sourced from `avgRunTimeMs` (eval_summaries), not `statusCounts` (test_case_eval_scores):
  // the latter can lag behind execution finishing, and gating the cost fetch on a signal that
  // arrives late would leave `useRunCosts` stuck at canHaveCosts=false — and thus permanently
  // unfetched — for a run that already has real cost data.
  const hasNoResults = data != null && data.avgRunTimeMs == null;
  // Cost aggregation doesn't support MCP-tool suites at all yet — confirmed by QA reproduction
  // (both cards stay in Calculating indefinitely regardless of whether the run computed metrics),
  // which disproved the earlier "MCP bills only through its metrics" assumption. Skip the fetch
  // unconditionally rather than polling toward a result the backend can never produce.
  const isMcpRun = run?.suiteSnapshot?.suiteType === SuiteType.McpTool;
  // A model with no Prompt/Completion rate configured can never produce a cost figure either — the
  // backend has nothing to multiply usage by. Resolved from the deployed model's own config, not
  // from `/costs`, so a run against such a model shows a dash immediately instead of polling toward
  // a result that will never arrive. Applications have no pricing of their own at the Admin level
  // (see `resolveModelPricing`), so this only ever fires for a model deployment.
  const { deploymentType } = useDeploymentType(run?.suiteSnapshot?.deploymentRef);
  const { isDefinitelyUnpriced } = useModelPricing(run?.suiteSnapshot?.deploymentRef?.id, deploymentType);
  const canHaveCosts = !isRunInProgress && !hasNoResults && !isMcpRun && !isDefinitelyUnpriced;
  const { costs, isPending: areCostsPending, unavailable: costsUnavailable } = useRunCosts(run?.id, canHaveCosts);

  if (!data) {
    return (
      <div className="flex h-24 items-center">
        <DialLoader size={32} />
      </div>
    );
  }

  const { statusCounts, avgRunTimeMs, avgMetricEvalDurationMs } = data;
  const avgSeconds = avgRunTimeMs != null ? formatAvgRunTimeSeconds(avgRunTimeMs) : null;
  const avgMetricEvalSeconds =
    avgMetricEvalDurationMs != null ? formatAvgRunTimeSeconds(avgMetricEvalDurationMs) : null;

  const testCaseCostDisplay = formatRunCost(costs?.avgTestCaseCost);
  const metricEvalCostDisplay = formatRunCost(costs?.avgMetricEvalCost);

  const showTestCasesPassed = hasOverallScoreThreshold(run.suiteSnapshot?.overallScoreThreshold);
  const hasStatusCounts = statusCounts.total > 0;
  const isRunIncomplete = isIncompleteRunStatus(run.status);
  // Reuses `hasNoResults` (eval_summaries-backed) rather than `hasStatusCounts`
  // (test_case_eval_scores-backed) so the cost cards' error state can't disagree with the signal
  // that decided whether `useRunCosts` even attempted a fetch.
  const hasCostError = costsUnavailable || (hasNoResults && !isRunIncomplete);
  const costDescription = areCostsPending
    ? t(RunsI18nKey.CostCalculatingElapsed)
    : hasCostError
      ? t(RunsI18nKey.CostDataUnavailable)
      : t(RunsI18nKey.AvgPerTestCase);
  const calculatingLabel = t(RunsI18nKey.Calculating);

  const costCardValue = (display: string | null): ReactNode => {
    if (areCostsPending) {
      return <CostCalculatingValue label={calculatingLabel} />;
    }
    if (hasCostError) {
      return undefined;
    }
    return display ?? NO_DATA_VALUE;
  };

  // A run that computed zero metrics can never have a metric-eval cost — there is no metric-eval
  // usage to bill, independent of suite type or the test-case side's own pricing. That's known from
  // the metric snapshots already fetched for the rest of the Summary tab, so this card can settle
  // immediately instead of sharing the Test Case LLM Cost card's Calculating wait for a field that
  // will always come back null.
  const hasNoMetrics = metricSnapshotCount === 0;
  const metricEvalCostError = hasNoMetrics ? false : hasCostError;
  const metricEvalCostDescription = hasNoMetrics ? t(RunsI18nKey.AvgPerTestCase) : costDescription;
  const metricEvalCostValue = hasNoMetrics ? NO_DATA_VALUE : costCardValue(metricEvalCostDisplay);

  return (
    <div className={ANALYTICS_KPI_GRID_CLASS}>
      {overallScore != null && (
        <DialAnalyticsCard
          className={getCardClassNames()}
          title={t(RunsI18nKey.OverallScore)}
          value={String(overallScore)}
          description={t(RunsI18nKey.OverallScoreDescription)}
        />
      )}
      {showTestCasesPassed && (
        <DialAnalyticsCard
          className={getCardClassNames(!hasStatusCounts && !isRunIncomplete)}
          title={t(RunsI18nKey.TestCasesPassed)}
          value={hasStatusCounts ? <PassFailFraction counts={statusCounts} /> : NO_DATA_VALUE}
          description={hasStatusCounts ? <PassFailStatusBreakdown counts={statusCounts} /> : <div />}
          error={!hasStatusCounts && !isRunIncomplete}
        />
      )}
      <DialAnalyticsCard
        className={getCardClassNames(avgSeconds == null && !isRunIncomplete)}
        title={t(RunsI18nKey.AvgTestCaseRunTime)}
        value={avgSeconds != null ? `${avgSeconds} ${t(RunsI18nKey.Seconds)}` : NO_DATA_VALUE}
        description={t(RunsI18nKey.AvgPerTestCase)}
        error={avgSeconds == null && !isRunIncomplete}
      />
      <DialAnalyticsCard
        className={getCardClassNames(avgMetricEvalSeconds == null && !isRunIncomplete)}
        title={t(RunsI18nKey.AvgMetricEvalLatency)}
        value={avgMetricEvalSeconds != null ? `${avgMetricEvalSeconds} ${t(RunsI18nKey.Seconds)}` : NO_DATA_VALUE}
        description={t(RunsI18nKey.AvgPerTestCase)}
        error={avgMetricEvalSeconds == null && !isRunIncomplete}
      />
      <DialAnalyticsCard
        className={getCardClassNames(hasCostError)}
        title={t(RunsI18nKey.TestCaseLlmCost)}
        value={costCardValue(testCaseCostDisplay)}
        description={costDescription}
        error={hasCostError}
      />
      <DialAnalyticsCard
        className={getCardClassNames(metricEvalCostError)}
        title={t(RunsI18nKey.MetricEvalCost)}
        value={metricEvalCostValue}
        description={metricEvalCostDescription}
        error={metricEvalCostError}
      />
    </div>
  );
};

export default Analytics;
