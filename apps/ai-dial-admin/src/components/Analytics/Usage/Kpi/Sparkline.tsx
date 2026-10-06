'use client';

import { FC, useMemo } from 'react';

import ReactECharts from 'echarts-for-react';
import { EChartsOption } from 'echarts-for-react/src/types';

import { useChartColors } from '@/src/hooks/use-chart-colors';

interface Props {
  points: number[];
}

const Sparkline: FC<Props> = ({ points }) => {
  const colors = useChartColors();
  const options: EChartsOption = useMemo(
    () => ({
      grid: { left: 0, right: 0, top: 2, bottom: 0 },
      xAxis: { type: 'category', show: false, boundaryGap: false, data: points.map((_, index) => index) },
      yAxis: { type: 'value', show: false, min: 0 },
      tooltip: { show: false },
      animation: false,
      silent: true,
      series: [
        {
          type: 'line',
          data: points,
          showSymbol: false,
          smooth: false,
          lineStyle: { width: 1.5, color: colors.accent },
          areaStyle: { color: colors.accent, opacity: 0.14 },
        },
      ],
    }),
    [points, colors],
  );

  if (points.length === 0) {
    return null;
  }

  return (
    <ReactECharts
      option={options}
      style={{ height: 34, width: '100%' }}
      opts={{ renderer: 'svg' }}
      notMerge
      aria-hidden
    />
  );
};

export default Sparkline;
