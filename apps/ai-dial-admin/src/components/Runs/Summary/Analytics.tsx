'use client';

import { FC, ReactNode } from 'react';

import { DialAnalyticsCard, DialLoader } from '@epam/ai-dial-ui-kit';

import PassFailFraction from '@/src/components/Common/PassFailStatus/PassFailFraction';
import PassFailStatusBreakdown from '@/src/components/Common/PassFailStatus/PassFailStatusBreakdown';
import { isIncompleteRunStatus, isTransitionalRunStatus } from '@/src/components/Common/RunStatus/utils';
import { ANALYTICS_KPI_CARD_CLASS, ANALYTICS_KPI_GRID_CLASS } from '@/src/components/Runs/Summary/constants';
import { useRunAnalyticsSlice } from '@/src/components/Runs/Summary/use-run-analytics-slice';
import { useRunCosts } from '@/src/components/Runs/Summary/use-run-costs';
import {
  formatAvgRunTimeSeconds,
  formatElapsedMmSs,
  formatRunCost,
  hasOverallScoreThreshold,
} from '@/src/components/Runs/Summary/utils';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { SuiteType } from '@/src/models/evaluation/test-suite';

const NO_DATA_VALUE = '—';

interface Props {
  run: Run;
  /** Run-level overall score from metric scores data; omitted while loading, null when absent. */
  overallScore?: number | null;
  /** How many metrics the run computed; omitted while the snapshots are still loading. */
  metricSnapshotCount?: number;
}

const CostCalculatingValue: FC<{ label: string }> = ({ label }) => (
  <div className="flex items-center gap-1" role="status">
    <span aria-hidden>
      <DialLoader size={20} fullWidth={false} />
    </span>
    <span className="dial-small-text text-secondary">{label}</span>
  </div>
);

const Analytics: FC<Props> = ({ run, overallScore, metricSnapshotCount }) => {
  const t = useI18n();
  const { data } = useRunAnalyticsSlice(run?.id);

  const isRunInProgress = isTransitionalRunStatus(run?.status);
  const hasNoResults = data?.statusCounts.total === 0;
  // An MCP row carries no price at all, so an MCP-tool suite bills only through its metrics.
  const isUnpricedMcpRun = run?.suiteSnapshot?.suiteType === SuiteType.McpTool && metricSnapshotCount === 0;
  const canHaveCosts = !isRunInProgress && !hasNoResults && !isUnpricedMcpRun;
  const {
    costs,
    isPending: areCostsPending,
    unavailable: costsUnavailable,
    elapsedMs: costsElapsedMs,
  } = useRunCosts(run?.id, canHaveCosts);

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
  const hasCostError = costsUnavailable || (!hasStatusCounts && !isRunIncomplete);
  const costDescription = areCostsPending
    ? t(RunsI18nKey.CostCalculatingElapsed, { elapsed: formatElapsedMmSs(costsElapsedMs) })
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

  return (
    <div className={ANALYTICS_KPI_GRID_CLASS}>
      {overallScore != null && (
        <DialAnalyticsCard
          className={ANALYTICS_KPI_CARD_CLASS}
          title={t(RunsI18nKey.OverallScore)}
          value={String(overallScore)}
          description={t(RunsI18nKey.OverallScoreDescription)}
        />
      )}
      {showTestCasesPassed && (
        <DialAnalyticsCard
          className={ANALYTICS_KPI_CARD_CLASS}
          title={t(RunsI18nKey.TestCasesPassed)}
          value={hasStatusCounts ? <PassFailFraction counts={statusCounts} /> : NO_DATA_VALUE}
          description={hasStatusCounts ? <PassFailStatusBreakdown counts={statusCounts} /> : undefined}
          error={!hasStatusCounts && !isRunIncomplete}
        />
      )}
      <DialAnalyticsCard
        className={ANALYTICS_KPI_CARD_CLASS}
        title={t(RunsI18nKey.AvgTestCaseRunTime)}
        value={avgSeconds != null ? `${avgSeconds} ${t(RunsI18nKey.Seconds)}` : NO_DATA_VALUE}
        description={t(RunsI18nKey.AvgPerTestCase)}
        error={avgSeconds == null && !isRunIncomplete}
      />
      <DialAnalyticsCard
        className={ANALYTICS_KPI_CARD_CLASS}
        title={t(RunsI18nKey.AvgMetricEvalLatency)}
        value={avgMetricEvalSeconds != null ? `${avgMetricEvalSeconds} ${t(RunsI18nKey.Seconds)}` : NO_DATA_VALUE}
        description={t(RunsI18nKey.AvgPerTestCase)}
        error={avgMetricEvalSeconds == null && !isRunIncomplete}
      />
      <DialAnalyticsCard
        className={ANALYTICS_KPI_CARD_CLASS}
        title={t(RunsI18nKey.TestCaseLlmCost)}
        value={costCardValue(testCaseCostDisplay)}
        description={costDescription}
        error={hasCostError}
      />
      <DialAnalyticsCard
        className={ANALYTICS_KPI_CARD_CLASS}
        title={t(RunsI18nKey.MetricEvalCost)}
        value={costCardValue(metricEvalCostDisplay)}
        description={costDescription}
        error={hasCostError}
      />
    </div>
  );
};

export default Analytics;
