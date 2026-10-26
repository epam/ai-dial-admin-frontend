'use client';

import { FC, useCallback } from 'react';

import { formatRunCost } from '@/src/components/Runs/Summary/utils';
import ComboTrendChart from '@/src/components/TestSuites/Trends/CostRuntime/ComboTrendChart';
import { COMBO_TREND_LINE_HEX } from '@/src/components/TestSuites/Trends/constants';
import { ComboTrendPoint } from '@/src/components/TestSuites/Trends/models';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { formatRunCostValue } from './utils/format-chart-value';

interface Props {
  points: ComboTrendPoint[];
  isLoading: boolean;
  sourceKind: string;
}

const CostTrendCard: FC<Props> = ({ points, isLoading, sourceKind }) => {
  const t = useI18n();

  const formatValue = useCallback((value: number | null) => formatRunCostValue(value) ?? '—', []);
  const formatTick = useCallback((value: number) => formatRunCost(value) ?? '$0', []);

  return (
    <ComboTrendChart
      points={points}
      isLoading={isLoading}
      title={t(TestSuitesI18nKey.CostTrend)}
      sourceLabel={t(TestSuitesI18nKey.TrendsSourceCost, { source: sourceKind })}
      metricsLabel={t(TestSuitesI18nKey.TrendsMetricsCost)}
      totalLabel={t(TestSuitesI18nKey.TrendsCostLine)}
      totalTooltipLabel={t(TestSuitesI18nKey.TrendsTotalCost)}
      lineColor={COMBO_TREND_LINE_HEX.cost}
      formatValue={formatValue}
      formatTick={formatTick}
    />
  );
};

export default CostTrendCard;
