'use client';

import { FC, useCallback } from 'react';

import ComboTrendChart from '@/src/components/TestSuites/Trends/CostRuntime/ComboTrendChart';
import { COMBO_TREND_LINE_HEX } from '@/src/components/TestSuites/Trends/constants';
import { ComboTrendPoint } from '@/src/components/TestSuites/Trends/models';
import { formatComboRuntimeSeconds } from '@/src/components/TestSuites/Trends/utils/format';
import { TestSuitesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  points: ComboTrendPoint[];
  isLoading: boolean;
  sourceKind: string;
}

const RuntimeTrendCard: FC<Props> = ({ points, isLoading, sourceKind }) => {
  const t = useI18n();

  const formatValue = useCallback((value: number | null) => {
    if (value == null || !Number.isFinite(value)) {
      return '—';
    }
    return formatComboRuntimeSeconds(value);
  }, []);
  const formatTick = useCallback((value: number) => formatComboRuntimeSeconds(value), []);

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
