'use client';

import { FC } from 'react';

import { AnalyticsCard, Spinner } from '@epam/ai-dial-ui-kit';

import { isIncompleteRunStatus } from '@/src/components/Common/RunStatus/utils';
import CostValue from '@/src/components/Runs/Summary/Cards/CostValue';
import OverallScoreInfo from '@/src/components/Runs/Summary/Cards/OverallScoreInfo';
import OverallScoreValue from '@/src/components/Runs/Summary/Cards/OverallScoreValue';
import PassRateValue from '@/src/components/Runs/Summary/Cards/PassRateValue';
import RuntimeValue from '@/src/components/Runs/Summary/Cards/RuntimeValue';
import TestCasesCompletedValue from '@/src/components/Runs/Summary/Cards/TestCasesCompletedValue';
import {
  ANALYTICS_KPI_CARD_CLASS,
  ANALYTICS_KPI_CARD_TOP_CLASS,
  ANALYTICS_KPI_GRID_CLASS,
} from '@/src/components/Runs/Summary/constants';
import { useRunAnalyticsSlice } from '@/src/components/Runs/Summary/use-run-analytics-slice';
import { useRunCostState } from '@/src/components/Runs/Summary/use-run-cost-state';
import {
  getCompletionRate,
  hasOverallScoreThreshold,
  sumRunTimeParts,
  toCompletionBreakdown,
} from '@/src/components/Runs/Summary/utils';
import { useSourceKindLabel } from '@/src/components/TestSuites/Trends/CostRuntime/use-source-kind-label';
import { RunsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  run: Run;
  /** Run-level overall score from metric scores data; omitted while loading, null when absent. */
  overallScore?: number | null;
  /** How many metrics the run computed; omitted while the snapshots are still loading. */
  metricSnapshotCount?: number;
  /** The run's suite, for the overall-score calculation method; omitted until it has loaded. */
  testSuite?: TestSuite | null;
}

const Analytics: FC<Props> = ({ run, overallScore, metricSnapshotCount, testSuite }) => {
  const t = useI18n();
  const { data } = useRunAnalyticsSlice(run?.id);
  const sourceLabel = useSourceKindLabel(run?.suiteSnapshot ?? {});
  const cost = useRunCostState({
    run,
    hasNoResults: data != null && data.totalRunTimeMs == null,
    metricSnapshotCount,
  });

  if (!data) {
    return (
      <div className="flex h-24 items-center">
        <Spinner size={32} fullWidth />
      </div>
    );
  }

  const threshold = run.suiteSnapshot?.overallScoreThreshold;
  const hasThreshold = hasOverallScoreThreshold(threshold);
  const breakdown = toCompletionBreakdown(data.statusCounts, hasThreshold);
  const rate = getCompletionRate(breakdown, hasThreshold);
  const rateTitle = t(hasThreshold ? RunsI18nKey.ThresholdPassRate : RunsI18nKey.CompletionRate);
  // Incomplete statuses (incl. CANCELLED/FAILED) never Error a card — missing figures are a dash.
  const isRunIncomplete = isIncompleteRunStatus(run.status);
  const hasNoTestCases = breakdown.total === 0 && !isRunIncomplete;
  const hasRuntimeError =
    sumRunTimeParts(data.totalRunTimeMs, data.totalMetricEvalDurationMs) == null && !isRunIncomplete;

  return (
    <div className={ANALYTICS_KPI_GRID_CLASS}>
      <AnalyticsCard
        className={ANALYTICS_KPI_CARD_TOP_CLASS}
        title={t(RunsI18nKey.TestCasesCompleted)}
        value={<TestCasesCompletedValue breakdown={breakdown} hasThreshold={hasThreshold} />}
        error={hasNoTestCases}
      />
      <AnalyticsCard
        className={ANALYTICS_KPI_CARD_TOP_CLASS}
        title={rateTitle}
        value={<PassRateValue rate={rate} threshold={threshold} label={rateTitle} />}
        error={hasNoTestCases}
      />
      {overallScore != null && (
        <AnalyticsCard
          className={ANALYTICS_KPI_CARD_CLASS}
          title={t(RunsI18nKey.OverallScore)}
          value={<OverallScoreValue score={overallScore} threshold={threshold} />}
          description={
            <span className="flex items-center gap-1">
              <span>{t(TestSuitesI18nKey.TrendsBasedOnCompletedStatic)}</span>
              {testSuite && <OverallScoreInfo testSuite={testSuite} metricCount={metricSnapshotCount ?? 0} />}
            </span>
          }
        />
      )}
      <AnalyticsCard
        className={ANALYTICS_KPI_CARD_TOP_CLASS}
        title={t(RunsI18nKey.TotalRuntime)}
        value={
          <RuntimeValue
            sourceMs={data.totalRunTimeMs}
            metricsMs={data.totalMetricEvalDurationMs}
            sourceLabel={sourceLabel}
          />
        }
        error={hasRuntimeError}
      />
      <AnalyticsCard
        className={ANALYTICS_KPI_CARD_TOP_CLASS}
        title={t(RunsI18nKey.TotalRunCost)}
        value={<CostValue cost={cost} sourceLabel={sourceLabel} />}
        error={cost.hasError}
      />
    </div>
  );
};

export default Analytics;
