'use client';

import { FC, useMemo } from 'react';

import ReactECharts from 'echarts-for-react';

import { HealthDistributionBar } from '@/src/components/EvalSystemHealth/models';
import { buildHealthDistributionOption } from '@/src/components/EvalSystemHealth/utils/build-health-distribution-option';
import { useChartColors } from '@/src/hooks/use-chart-colors';
import { useI18n } from '@/src/locales/client';

/** The height of the skeleton this chart replaced, so the row of the page does not move as it loads. */
export const HEALTH_DISTRIBUTION_CHART_HEIGHT = 320;

interface Props {
  bars: HealthDistributionBar[];
}

/** The drawn bars, hidden from assistive technology: `HealthDistributionTable` states the same figures as text. */
const HealthDistributionChart: FC<Props> = ({ bars }) => {
  const t = useI18n();
  const colors = useChartColors();
  const option = useMemo(() => buildHealthDistributionOption(bars, colors, t), [bars, colors, t]);

  return (
    <div aria-hidden>
      <ReactECharts option={option} style={{ height: HEALTH_DISTRIBUTION_CHART_HEIGHT, width: '100%' }} notMerge />
    </div>
  );
};

export default HealthDistributionChart;
