'use client';

import { FC } from 'react';

import { DialAnalyticsCard, DialLoader } from '@epam/ai-dial-ui-kit';

import PassedTestCasesValue from '@/src/components/Runs/Summary/PassedTestCasesValue';
import TestCaseStatusBreakdown from '@/src/components/Runs/Summary/TestCaseStatusBreakdown';
import { ANALYTICS_KPI_CARD_CLASS, ANALYTICS_KPI_GRID_CLASS } from '@/src/components/Runs/Summary/constants';
import { useRunAnalyticsSlice } from '@/src/components/Runs/Summary/use-run-analytics-slice';
import { useRunCosts } from '@/src/components/Runs/Summary/use-run-costs';
import { formatAvgRunTimeSeconds, formatRunCost } from '@/src/components/Runs/Summary/utils';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';

const COST_UNAVAILABLE_VALUE = '—';

interface Props {
  run: Run;
  /** Run-level overall score from metric scores data; omitted while loading, null when absent. */
  overallScore?: number | null;
}

const Analytics: FC<Props> = ({ run, overallScore }) => {
  const t = useI18n();
  const { data } = useRunAnalyticsSlice(run?.id);
  const { costs, isLoading: costsLoading, unavailable: costsUnavailable } = useRunCosts(run?.id);

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
  const costDescription = costsUnavailable ? t(RunsI18nKey.CostDataUnavailable) : t(RunsI18nKey.AvgPerTestCase);

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
      <DialAnalyticsCard
        className={ANALYTICS_KPI_CARD_CLASS}
        title={t(RunsI18nKey.TestCasesPassed)}
        value={<PassedTestCasesValue counts={statusCounts} />}
        description={<TestCaseStatusBreakdown counts={statusCounts} />}
        error={statusCounts.total === 0}
      />
      <DialAnalyticsCard
        className={ANALYTICS_KPI_CARD_CLASS}
        title={t(RunsI18nKey.AvgTestCaseRunTime)}
        value={avgSeconds != null ? `${avgSeconds} ${t(RunsI18nKey.Seconds)}` : undefined}
        description={t(RunsI18nKey.AvgPerTestCase)}
        error={avgSeconds == null}
      />
      <DialAnalyticsCard
        className={ANALYTICS_KPI_CARD_CLASS}
        title={t(RunsI18nKey.AvgMetricEvalLatency)}
        value={avgMetricEvalSeconds != null ? `${avgMetricEvalSeconds} ${t(RunsI18nKey.Seconds)}` : undefined}
        description={t(RunsI18nKey.AvgPerTestCase)}
        error={avgMetricEvalSeconds == null}
      />
      <DialAnalyticsCard
        className={ANALYTICS_KPI_CARD_CLASS}
        title={t(RunsI18nKey.TestCaseLlmCost)}
        value={costsUnavailable ? undefined : (testCaseCostDisplay ?? COST_UNAVAILABLE_VALUE)}
        description={costDescription}
        isLoading={costsLoading}
        error={costsUnavailable}
      />
      <DialAnalyticsCard
        className={ANALYTICS_KPI_CARD_CLASS}
        title={t(RunsI18nKey.MetricEvalCost)}
        value={costsUnavailable ? undefined : (metricEvalCostDisplay ?? COST_UNAVAILABLE_VALUE)}
        description={costDescription}
        isLoading={costsLoading}
        error={costsUnavailable}
      />
    </div>
  );
};

export default Analytics;
