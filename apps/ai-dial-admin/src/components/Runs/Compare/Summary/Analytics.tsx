'use client';

import { FC } from 'react';

import { DialAnalyticsCard, DialLoader } from '@epam/ai-dial-ui-kit';

import PassFailFraction from '@/src/components/Common/PassFailStatus/PassFailFraction';
import PassFailStatusBreakdown from '@/src/components/Common/PassFailStatus/PassFailStatusBreakdown';
import { getMetricDelta, MetricDeltaKind } from '@/src/components/Runs/Compare/ExecutionResults/utils/metric-utils';
import { RunAnalyticsSlice, TestCaseStatusCounts } from '@/src/components/Runs/Summary/models';
import { useRunAnalyticsSlice } from '@/src/components/Runs/Summary/use-run-analytics-slice';
import { formatAvgRunTimeSeconds } from '@/src/components/Runs/Summary/utils';
import { RunsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

const THRESHOLD_UNAVAILABLE_VALUE = '—';

interface Props {
  primaryRunId: string;
  comparedRunId: string;
  primaryRunName: string;
  comparedRunName: string;
  onlyMatchingTestCases: boolean;
  primaryMatchedAnalytics: RunAnalyticsSlice | null;
  comparedMatchedAnalytics: RunAnalyticsSlice | null;
  primaryOverallScore?: number | null;
  comparedOverallScore?: number | null;
  hasPrimaryThreshold: boolean;
  hasComparedThreshold: boolean;
}

const thresholdSideValue = (hasThreshold: boolean, runName: string, counts: TestCaseStatusCounts) => {
  if (!hasThreshold) {
    return THRESHOLD_UNAVAILABLE_VALUE;
  }

  return (
    <div className="flex flex-col gap-0.5">
      <PassFailFraction counts={counts} />
      <PassFailStatusBreakdown counts={counts} compact tooltipTitle={runName} />
    </div>
  );
};

const Analytics: FC<Props> = ({
  primaryRunId,
  comparedRunId,
  primaryRunName,
  comparedRunName,
  onlyMatchingTestCases,
  primaryMatchedAnalytics,
  comparedMatchedAnalytics,
  primaryOverallScore,
  comparedOverallScore,
  hasPrimaryThreshold,
  hasComparedThreshold,
}) => {
  const t = useI18n();
  const { data: primaryFull } = useRunAnalyticsSlice(onlyMatchingTestCases ? undefined : primaryRunId);
  const { data: comparedFull } = useRunAnalyticsSlice(onlyMatchingTestCases ? undefined : comparedRunId);

  const primary = onlyMatchingTestCases ? primaryMatchedAnalytics : primaryFull;
  const compared = onlyMatchingTestCases ? comparedMatchedAnalytics : comparedFull;

  if (!primary || !compared) {
    return (
      <div className="flex h-24 items-center">
        <DialLoader size={32} />
      </div>
    );
  }

  const showOverall = primaryOverallScore != null || comparedOverallScore != null;
  const overallDelta = getMetricDelta(primaryOverallScore, comparedOverallScore);
  const showTestCasesPassed = hasPrimaryThreshold || hasComparedThreshold;
  const passedDelta =
    hasPrimaryThreshold && hasComparedThreshold
      ? getMetricDelta(primary.statusCounts.passed, compared.statusCounts.passed)
      : null;
  const isPrimaryPassedEmpty = !hasPrimaryThreshold || primary.statusCounts.total === 0;
  const isComparedPassedEmpty = !hasComparedThreshold || compared.statusCounts.total === 0;
  const primarySeconds = primary.avgRunTimeMs != null ? formatAvgRunTimeSeconds(primary.avgRunTimeMs) : null;
  const comparedSeconds = compared.avgRunTimeMs != null ? formatAvgRunTimeSeconds(compared.avgRunTimeMs) : null;
  const runtimeDelta = getMetricDelta(primarySeconds, comparedSeconds);
  const primaryMetricEvalSeconds =
    primary.avgMetricEvalDurationMs != null ? formatAvgRunTimeSeconds(primary.avgMetricEvalDurationMs) : null;
  const comparedMetricEvalSeconds =
    compared.avgMetricEvalDurationMs != null ? formatAvgRunTimeSeconds(compared.avgMetricEvalDurationMs) : null;
  const metricEvalDelta = getMetricDelta(primaryMetricEvalSeconds, comparedMetricEvalSeconds);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
      {showOverall && (
        <DialAnalyticsCard
          className="min-w-0 flex-1"
          title={t(RunsI18nKey.OverallScore)}
          description={t(RunsI18nKey.OverallScoreDescription)}
          delta={overallDelta.kind === MetricDeltaKind.Changed ? overallDelta.value : undefined}
          compareValues={[
            {
              title: primaryRunName,
              value: primaryOverallScore != null ? String(primaryOverallScore) : '—',
            },
            {
              title: comparedRunName,
              value: comparedOverallScore != null ? String(comparedOverallScore) : '—',
            },
          ]}
        />
      )}
      {showTestCasesPassed && (
        <DialAnalyticsCard
          className="min-w-0 flex-1"
          title={t(RunsI18nKey.TestCasesPassed)}
          delta={passedDelta?.kind === MetricDeltaKind.Changed ? passedDelta.value : undefined}
          compareValues={[
            {
              title: primaryRunName,
              value: thresholdSideValue(hasPrimaryThreshold, primaryRunName, primary.statusCounts),
            },
            {
              title: comparedRunName,
              value: thresholdSideValue(hasComparedThreshold, comparedRunName, compared.statusCounts),
            },
          ]}
          error={isPrimaryPassedEmpty && isComparedPassedEmpty}
        />
      )}
      <DialAnalyticsCard
        className="min-w-0 flex-1"
        title={t(RunsI18nKey.AvgTestCaseRunTime)}
        description={t(RunsI18nKey.AvgPerTestCase)}
        delta={runtimeDelta.kind === MetricDeltaKind.Changed ? runtimeDelta.value : undefined}
        deltaPositive={runtimeDelta.value != null && runtimeDelta.value < 0}
        deltaUnit={t(RunsI18nKey.Seconds)}
        compareValues={[
          {
            title: primaryRunName,
            value: primarySeconds != null ? `${primarySeconds} ${t(RunsI18nKey.Seconds)}` : '—',
          },
          {
            title: comparedRunName,
            value: comparedSeconds != null ? `${comparedSeconds} ${t(RunsI18nKey.Seconds)}` : '—',
          },
        ]}
        error={primarySeconds == null && comparedSeconds == null}
      />
      <DialAnalyticsCard
        className="min-w-0 flex-1"
        title={t(RunsI18nKey.AvgMetricEvalLatency)}
        description={t(RunsI18nKey.AvgPerTestCase)}
        delta={metricEvalDelta.kind === MetricDeltaKind.Changed ? metricEvalDelta.value : undefined}
        deltaPositive={metricEvalDelta.value != null && metricEvalDelta.value < 0}
        deltaUnit={t(RunsI18nKey.Seconds)}
        compareValues={[
          {
            title: primaryRunName,
            value: primaryMetricEvalSeconds != null ? `${primaryMetricEvalSeconds} ${t(RunsI18nKey.Seconds)}` : '—',
          },
          {
            title: comparedRunName,
            value: comparedMetricEvalSeconds != null ? `${comparedMetricEvalSeconds} ${t(RunsI18nKey.Seconds)}` : '—',
          },
        ]}
        error={primaryMetricEvalSeconds == null && comparedMetricEvalSeconds == null}
      />
    </div>
  );
};

export default Analytics;
