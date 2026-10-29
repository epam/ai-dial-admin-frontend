'use client';

import { FC } from 'react';

import { formatRunCost } from '@/src/components/Runs/Summary/utils';
import LatestComboTotalCard from '@/src/components/TestSuites/Trends/Kpi/LatestComboTotalCard';
import OverallScoreOfLatestRunCard from '@/src/components/TestSuites/Trends/Kpi/OverallScoreOfLatestRunCard';
import PassRateCard from '@/src/components/TestSuites/Trends/Kpi/PassRateCard';
import { formatCostDelta, formatRuntimeDelta } from '@/src/components/TestSuites/Trends/Kpi/utils/kpi-delta';
import { ComboTrendPoint, RunTestCaseSegments, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { formatSuiteRunTime } from '@/src/components/TestSuites/Trends/utils/format';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';

interface Props {
  runOrder: TrendsRunPoint[];
  selectedTestSuite: TestSuite;
  segments: RunTestCaseSegments[];
  costPoints: ComboTrendPoint[];
  runtimePoints: ComboTrendPoint[];
  sourceKind: string;
  isEvalLoading?: boolean;
  isCostLoading?: boolean;
  isRuntimeLoading?: boolean;
  hasEvalError?: boolean;
}

const formatCostValue = (value: number | null): string => formatRunCost(value) ?? '—';

const formatRuntimeValue = (value: number | null): string =>
  value != null && Number.isFinite(value) ? formatSuiteRunTime(value) : '—';

const KpiStrip: FC<Props> = ({
  runOrder,
  selectedTestSuite,
  segments,
  costPoints,
  runtimePoints,
  sourceKind,
  isEvalLoading,
  isCostLoading,
  isRuntimeLoading,
  hasEvalError,
}) => {
  const t = useI18n();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2 xl:flex xl:flex-row xl:gap-4">
      <PassRateCard
        className="flex-1 sm:min-w-[180px]"
        segments={segments}
        overallScoreThreshold={selectedTestSuite.overallScoreThreshold}
        isLoading={isEvalLoading}
        hasError={hasEvalError}
      />
      <OverallScoreOfLatestRunCard
        className="flex-1 sm:min-w-[180px]"
        runOrder={runOrder}
        selectedTestSuite={selectedTestSuite}
      />
      <LatestComboTotalCard
        className="flex-1 sm:min-w-[180px]"
        points={runtimePoints}
        sourceLabel={sourceKind}
        isLoading={isRuntimeLoading}
        title={t(TestSuitesI18nKey.TotalRuntimeOfLatestRun)}
        formatValue={formatRuntimeValue}
        formatDelta={formatRuntimeDelta}
      />
      <LatestComboTotalCard
        className="flex-1 sm:min-w-[180px]"
        points={costPoints}
        sourceLabel={sourceKind}
        isLoading={isCostLoading}
        title={t(TestSuitesI18nKey.TotalCostOfLatestRun)}
        formatValue={formatCostValue}
        formatDelta={formatCostDelta}
      />
    </div>
  );
};

export default KpiStrip;
