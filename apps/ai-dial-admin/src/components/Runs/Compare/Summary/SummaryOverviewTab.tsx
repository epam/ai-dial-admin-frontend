'use client';

import { FC, useCallback } from 'react';

import { Spinner, NoDataContent } from '@epam/ai-dial-ui-kit';

import Analytics from '@/src/components/Runs/Compare/Summary/Analytics';
import DistributionSection from '@/src/components/Runs/Compare/Summary/DistributionSection';
import Header from '@/src/components/Runs/Compare/Summary/Header';
import MetricScoresSection from '@/src/components/Runs/Compare/Summary/MetricScoresSection';
import { useSummaryOverviewData } from '@/src/components/Runs/Compare/Summary/use-summary-overview-data';
import { CompareRun, SummaryOverviewTabUiState } from '@/src/components/Runs/Compare/models';
import { SUMMARY_PANELS_GRID_CLASS } from '@/src/components/Runs/Summary/constants';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  primaryRunId: string;
  comparedRunId: string;
  runs: CompareRun[];
  onlyMatchingTestCases: boolean;
  summaryState: SummaryOverviewTabUiState;
  setSummaryState: (patch: Partial<SummaryOverviewTabUiState>) => void;
}

const SummaryOverviewTab: FC<Props> = ({
  primaryRunId,
  comparedRunId,
  runs,
  onlyMatchingTestCases,
  summaryState,
  setSummaryState,
}) => {
  const t = useI18n();
  const {
    primaryRun,
    comparedRun,
    primaryTestSuite,
    comparedTestSuite,
    primaryMetricCount,
    comparedMetricCount,
    enrichedPrimaryScores,
    enrichedComparedScores,
    metricOptions,
    primaryMatchedAnalytics,
    comparedMatchedAnalytics,
    primaryUnmatchedIds,
    comparedUnmatchedIds,
    hasNoMatchingTestCases,
  } = useSummaryOverviewData({
    primaryRunId,
    comparedRunId,
    onlyMatchingTestCases,
    summaryState,
    setSummaryState,
  });

  const onSelectStatistic = useCallback(
    (statistic: string) => setSummaryState({ selectedStatistic: statistic }),
    [setSummaryState],
  );

  const onSelectDistributionMetric = useCallback(
    (name: string | null) => setSummaryState({ selectedDistributionMetricName: name }),
    [setSummaryState],
  );

  if (!primaryRun || !comparedRun) {
    return (
      <div className="flex size-full items-center justify-center">
        <Spinner size={40} fullWidth />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-8 overflow-auto">
      <div className="flex shrink-0 flex-col gap-8">
        <Header
          primaryRun={primaryRun}
          comparedRun={comparedRun}
          runs={runs}
          primaryTestSuite={primaryTestSuite}
          comparedTestSuite={comparedTestSuite}
        />
        {!hasNoMatchingTestCases && (
          <Analytics
            primaryRun={primaryRun}
            comparedRun={comparedRun}
            runs={runs}
            onlyMatchingTestCases={onlyMatchingTestCases}
            primaryMatchedAnalytics={primaryMatchedAnalytics}
            comparedMatchedAnalytics={comparedMatchedAnalytics}
            primaryOverallScore={enrichedPrimaryScores?.overallScore}
            comparedOverallScore={enrichedComparedScores?.overallScore}
            primaryTestSuite={primaryTestSuite}
            comparedTestSuite={comparedTestSuite}
            primaryMetricCount={primaryMetricCount}
            comparedMetricCount={comparedMetricCount}
          />
        )}
      </div>
      {hasNoMatchingTestCases ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <NoDataContent title={t(EntitiesI18nKey.NoResults)} />
        </div>
      ) : (
        <div className={SUMMARY_PANELS_GRID_CLASS}>
          <MetricScoresSection
            primaryData={enrichedPrimaryScores}
            comparedData={enrichedComparedScores}
            runs={runs}
            selectedStatistic={summaryState.selectedStatistic}
            onSelectStatistic={onSelectStatistic}
            onSelectMetric={onSelectDistributionMetric}
          />
          <DistributionSection
            primaryRunId={primaryRunId}
            comparedRunId={comparedRunId}
            runs={runs}
            metricOptions={metricOptions}
            primaryMetricScores={enrichedPrimaryScores}
            comparedMetricScores={enrichedComparedScores}
            selectedMetricName={summaryState.selectedDistributionMetricName}
            onSelectMetric={onSelectDistributionMetric}
            primaryExcludeEvalSummaryIds={primaryUnmatchedIds}
            comparedExcludeEvalSummaryIds={comparedUnmatchedIds}
          />
        </div>
      )}
    </div>
  );
};

export default SummaryOverviewTab;
