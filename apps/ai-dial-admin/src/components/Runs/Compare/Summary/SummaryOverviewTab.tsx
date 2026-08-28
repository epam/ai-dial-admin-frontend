'use client';

import { FC, useCallback } from 'react';

import { DialLoader, DialNoDataContent } from '@epam/ai-dial-ui-kit';

import Analytics from '@/src/components/Runs/Compare/Summary/Analytics';
import DistributionSection from '@/src/components/Runs/Compare/Summary/DistributionSection';
import Header from '@/src/components/Runs/Compare/Summary/Header';
import MetricScoresSection from '@/src/components/Runs/Compare/Summary/MetricScoresSection';
import { useSummaryOverviewData } from '@/src/components/Runs/Compare/Summary/use-summary-overview-data';
import { SummaryOverviewTabUiState } from '@/src/components/Runs/Compare/models';
import { SUMMARY_PANELS_GRID_CLASS } from '@/src/components/Runs/Summary/constants';
import { EntitiesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  primaryRunId: string;
  comparedRunId: string;
  primaryRunName: string;
  comparedRunName: string;
  onlyMatchingTestCases: boolean;
  summaryState: SummaryOverviewTabUiState;
  setSummaryState: (patch: Partial<SummaryOverviewTabUiState>) => void;
}

const SummaryOverviewTab: FC<Props> = ({
  primaryRunId,
  comparedRunId,
  primaryRunName,
  comparedRunName,
  onlyMatchingTestCases,
  summaryState,
  setSummaryState,
}) => {
  const t = useI18n();
  const {
    primaryRun,
    comparedRun,
    testSuite,
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
        <DialLoader size={40} />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-8 overflow-auto">
      <div className="flex shrink-0 flex-col gap-8">
        <Header
          primaryRun={primaryRun}
          comparedRun={comparedRun}
          primaryRunName={primaryRunName}
          comparedRunName={comparedRunName}
          testSuite={testSuite}
        />
        {!hasNoMatchingTestCases && (
          <Analytics
            primaryRunId={primaryRunId}
            comparedRunId={comparedRunId}
            primaryRunName={primaryRunName}
            comparedRunName={comparedRunName}
            onlyMatchingTestCases={onlyMatchingTestCases}
            primaryMatchedAnalytics={primaryMatchedAnalytics}
            comparedMatchedAnalytics={comparedMatchedAnalytics}
            primaryOverallScore={enrichedPrimaryScores?.overallScore}
            comparedOverallScore={enrichedComparedScores?.overallScore}
          />
        )}
      </div>
      {hasNoMatchingTestCases ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <DialNoDataContent title={t(EntitiesI18nKey.NoResults)} />
        </div>
      ) : (
        <div className={SUMMARY_PANELS_GRID_CLASS}>
          <MetricScoresSection
            primaryData={enrichedPrimaryScores}
            comparedData={enrichedComparedScores}
            primaryRunName={primaryRunName}
            comparedRunName={comparedRunName}
            selectedStatistic={summaryState.selectedStatistic}
            onSelectStatistic={onSelectStatistic}
            onSelectMetric={onSelectDistributionMetric}
          />
          <DistributionSection
            primaryRunId={primaryRunId}
            comparedRunId={comparedRunId}
            primaryRunName={primaryRunName}
            comparedRunName={comparedRunName}
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
