'use client';

import { FC } from 'react';

import { DialAnalyticsCard, DialLoader } from '@epam/ai-dial-ui-kit';

import PassedTestCasesValue from '@/src/components/Runs/Summary/PassedTestCasesValue';
import TestCaseStatusBreakdown from '@/src/components/Runs/Summary/TestCaseStatusBreakdown';
import { useRunAnalyticsSlice } from '@/src/components/Runs/Summary/use-run-analytics-slice';
import { formatAvgRunTimeSeconds } from '@/src/components/Runs/Summary/utils';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Run } from '@/src/models/evaluation/run';

interface Props {
  run: Run;
  /** Run-level overall score from metric scores data; omitted while loading, null when absent. */
  overallScore?: number | null;
}

const Analytics: FC<Props> = ({ run, overallScore }) => {
  const t = useI18n();
  const { data } = useRunAnalyticsSlice(run?.id);

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

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
      {overallScore != null && (
        <DialAnalyticsCard
          className="flex-1 sm:max-w-xs"
          title={t(RunsI18nKey.OverallScore)}
          value={String(overallScore)}
          description={t(RunsI18nKey.OverallScoreDescription)}
        />
      )}
      <DialAnalyticsCard
        className="flex-1 sm:max-w-xs"
        title={t(RunsI18nKey.TestCasesPassed)}
        value={<PassedTestCasesValue counts={statusCounts} />}
        description={<TestCaseStatusBreakdown counts={statusCounts} />}
        error={statusCounts.total === 0}
      />
      <DialAnalyticsCard
        className="flex-1 sm:max-w-xs"
        title={t(RunsI18nKey.AvgTestCaseRunTime)}
        value={avgSeconds != null ? `${avgSeconds} ${t(RunsI18nKey.Seconds)}` : undefined}
        description={t(RunsI18nKey.AvgPerTestCase)}
        error={avgSeconds == null}
      />
      <DialAnalyticsCard
        className="flex-1 sm:max-w-xs"
        title={t(RunsI18nKey.AvgMetricEvalLatency)}
        value={avgMetricEvalSeconds != null ? `${avgMetricEvalSeconds} ${t(RunsI18nKey.Seconds)}` : undefined}
        description={t(RunsI18nKey.AvgPerTestCase)}
        error={avgMetricEvalSeconds == null}
      />
    </div>
  );
};

export default Analytics;
