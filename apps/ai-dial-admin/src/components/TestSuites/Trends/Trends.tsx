'use client';

import { FC, useEffect } from 'react';

import {
  OutlinedButton,
  Notification,
  NotificationType,
  ElementSize,
  NotificationVariant,
  Spinner,
} from '@epam/ai-dial-ui-kit';
import { IconPlayerPlay } from '@tabler/icons-react';

import CostTrendCard from '@/src/components/TestSuites/Trends/CostRuntime/CostTrendCard';
import RuntimeTrendCard from '@/src/components/TestSuites/Trends/CostRuntime/RuntimeTrendCard';
import { useCostTrendData } from '@/src/components/TestSuites/Trends/CostRuntime/use-cost-trend-data';
import { useRuntimeTrendData } from '@/src/components/TestSuites/Trends/CostRuntime/use-runtime-trend-data';
import { useSourceKindLabel } from '@/src/components/TestSuites/Trends/CostRuntime/use-source-kind-label';
import KpiStrip from '@/src/components/TestSuites/Trends/Kpi/KpiStrip';
import MetricTrends from '@/src/components/TestSuites/Trends/MetricTrends/MetricTrends';
import OverallScoreTrend from '@/src/components/TestSuites/Trends/OverallScoreTrend/OverallScoreTrend';
import TestCaseStability from '@/src/components/TestSuites/Trends/Stability/TestCaseStability';
import LatestRunCard from '@/src/components/TestSuites/Trends/TestCases/LatestRunCard';
import TestCasesByRunCard from '@/src/components/TestSuites/Trends/TestCases/TestCasesByRunCard';
import { useTestCasesEvalData } from '@/src/components/TestSuites/Trends/TestCases/use-test-cases-eval-data';
import { useTrendsData } from '@/src/components/TestSuites/Trends/use-trends-data';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  selectedTestSuite: TestSuite;
  onStartRun?: () => void;
  onTrendsRunCountChange?: (runCount: number | null) => void;
}

const Trends: FC<Props> = ({ selectedTestSuite, onStartRun, onTrendsRunCountChange }) => {
  const t = useI18n();
  const { data, isLoading } = useTrendsData(selectedTestSuite.id);
  const isEmpty = !data || data.kpis.runCount === 0;
  const runOrder = data?.runOrder ?? [];
  const {
    segments: testCaseSegments,
    isLoading: isEvalLoading,
    hasError: hasEvalError,
  } = useTestCasesEvalData(runOrder);
  const { points: costPoints, isLoading: isCostLoading } = useCostTrendData(runOrder);
  const { points: runtimePoints, isLoading: isRuntimeLoading } = useRuntimeTrendData(runOrder);
  const sourceKind = useSourceKindLabel(selectedTestSuite);
  const latestRunSegments = testCaseSegments.length > 0 ? testCaseSegments[testCaseSegments.length - 1] : null;
  const latestRunThreshold = runOrder[runOrder.length - 1]?.overallScoreThreshold;

  const metricCount = runOrder[runOrder.length - 1]?.metricNames?.length ?? 0;

  useEffect(() => {
    onTrendsRunCountChange?.(data?.kpis.runCount ?? null);
  }, [data?.kpis.runCount, onTrendsRunCountChange]);

  if (isLoading && !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size={40} fullWidth />
      </div>
    );
  }

  if (isEmpty || !data) {
    return (
      <div className="p-4">
        <Notification
          variant={NotificationVariant.Info}
          type={NotificationType.SectionMessage}
          iconSize={20}
          textClassName="flex-col"
          title={t(TestSuitesI18nKey.TrendsNoRunsTitle)}
          message={
            <div className="flex flex-col items-start gap-2">
              <span>{t(TestSuitesI18nKey.TrendsNoRunsDescription)}</span>
              {onStartRun && (
                <OutlinedButton
                  size={ElementSize.Small}
                  className="w-fit"
                  label={t(ButtonsI18nKey.Run)}
                  iconBefore={<IconPlayerPlay {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
                  onClick={onStartRun}
                  disabled={selectedTestSuite.valid === false}
                />
              )}
            </div>
          }
          role="status"
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-auto p-4">
      {data.kpis.runCount === 1 && (
        <Notification
          variant={NotificationVariant.Info}
          type={NotificationType.SectionMessage}
          iconSize={20}
          message={t(TestSuitesI18nKey.TrendsSingleRunMessage)}
          role="status"
        />
      )}
      <KpiStrip
        runOrder={data.runOrder}
        selectedTestSuite={selectedTestSuite}
        segments={testCaseSegments}
        metricCount={metricCount}
        costPoints={costPoints}
        runtimePoints={runtimePoints}
        sourceKind={sourceKind}
        isEvalLoading={isEvalLoading}
        isCostLoading={isCostLoading}
        isRuntimeLoading={isRuntimeLoading}
        hasEvalError={hasEvalError}
      />
      <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-stretch">
        <TestCasesByRunCard
          segments={testCaseSegments}
          runOrder={runOrder}
          isLoading={isEvalLoading}
          hasError={hasEvalError}
        />
        <LatestRunCard
          segments={latestRunSegments}
          threshold={latestRunThreshold}
          isLoading={isEvalLoading}
          hasError={hasEvalError}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <OverallScoreTrend
            runOrder={data.runOrder}
            overallScoreThreshold={selectedTestSuite.overallScoreThreshold}
            isLoading={isLoading}
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-stretch">
        <CostTrendCard points={costPoints} isLoading={isCostLoading} sourceKind={sourceKind} />
        <RuntimeTrendCard points={runtimePoints} isLoading={isRuntimeLoading} sourceKind={sourceKind} />
      </div>
      <MetricTrends
        runOrder={data.runOrder}
        statistics={data.statistics}
        byStatistic={data.byStatistic}
        isLoading={isLoading}
      />
      <TestCaseStability runOrder={data.runOrder} selectedTestSuite={selectedTestSuite} />
    </div>
  );
};

export default Trends;
