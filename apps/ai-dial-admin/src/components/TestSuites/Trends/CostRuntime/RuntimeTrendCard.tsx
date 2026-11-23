'use client';

import { FC, useCallback } from 'react';

import ComboTrendChart from '@/src/components/TestSuites/Trends/CostRuntime/ComboTrendChart';
import { COMBO_TREND_LINE_HEX } from '@/src/components/TestSuites/Trends/constants';
import { ComboTrendPoint } from '@/src/components/TestSuites/Trends/models';
import { formatRunDuration } from '@/src/components/Runs/utils/run-list-values';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  points: ComboTrendPoint[];
  isLoading: boolean;
  sourceKind: string;
}

const RuntimeTrendCard: FC<Props> = ({ points, isLoading, sourceKind }) => {
  const t = useI18n();

  const formatValue = useCallback((value: number | null) => formatRunDuration(value) ?? '—', []);
  const formatTick = useCallback((value: number) => formatRunDuration(value) ?? '—', []);

  return (
    <ComboTrendChart
      points={points}
      isLoading={isLoading}
      title={t(TestSuitesI18nKey.RuntimeTrend)}
      sourceLabel={t(TestSuitesI18nKey.TrendsSourceRuntime, { source: sourceKind })}
      metricsLabel={t(TestSuitesI18nKey.TrendsMetricsRuntime)}
      totalLabel={t(TestSuitesI18nKey.TrendsTimeLine)}
      totalTooltipLabel={t(TestSuitesI18nKey.TrendsTotalTime)}
      lineColor={COMBO_TREND_LINE_HEX.runtime}
      formatValue={formatValue}
      formatTick={formatTick}
    />
  );
};

export default RuntimeTrendCard;
