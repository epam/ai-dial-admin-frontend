import ReactECharts from 'echarts-for-react';
import { FC, useMemo } from 'react';

import MetricCardShell from '@/src/components/Common/MetricCard/MetricCardShell';
import { MetricStatus } from '@/src/components/Common/MetricCard/models';
import { getStatusColor } from '@/src/components/Common/MetricCard/utils';
import { useChartColors } from '@/src/hooks/use-chart-colors';

interface Props {
  title: string;
  value: number | null;
  loading: boolean;
  status?: MetricStatus;
  emptyReason?: string;
  // Colored zone boundaries on the arc (fractions of max), e.g. { warn: 0.7, crit: 0.9 }.
  thresholds?: { warn: number; crit: number };
}

const GaugeCard: FC<Props> = ({ title, value, loading, status = MetricStatus.Neutral, emptyReason, thresholds }) => {
  const colors = useChartColors();
  const option = useMemo(() => {
    const zones = thresholds
      ? [
          [thresholds.warn, colors.success],
          [thresholds.crit, colors.warning],
          [1, colors.error],
        ]
      : [[1, colors.track]];

    return {
      series: [
        {
          type: 'gauge',
          min: 0,
          max: 1,
          startAngle: 210,
          endAngle: -30,
          radius: '88%',
          center: ['50%', '55%'],
          progress: { show: false },
          axisLine: { lineStyle: { width: 8, color: zones } },
          // Needle marks where the current value sits against the colored zones.
          pointer: { show: true, length: '62%', width: 4, itemStyle: { color: colors.value } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          anchor: { show: true, size: 8, itemStyle: { color: colors.value } },
          title: { show: false },
          detail: {
            formatter: (v: number) => `${Math.round(v * 100)}%`,
            fontSize: 24,
            fontWeight: 600,
            color: getStatusColor(colors, status),
            offsetCenter: [0, '38%'],
          },
          data: [{ value: value ?? 0 }],
        },
      ],
    };
  }, [value, status, thresholds, colors]);

  return (
    <MetricCardShell title={title} loading={loading} isEmpty={value === null} emptyReason={emptyReason} status={status}>
      <div className="flex w-full flex-col items-center">
        <ReactECharts option={option} style={{ height: 120, width: '100%' }} notMerge lazyUpdate />
        {thresholds && (
          <div className="flex justify-center gap-3 text-xs">
            <span className="text-success">{`0–${Math.round(thresholds.warn * 100)}%`}</span>
            <span className="text-warning">{`${Math.round(thresholds.warn * 100)}–${Math.round(thresholds.crit * 100)}%`}</span>
            <span className="text-error">{`${Math.round(thresholds.crit * 100)}%+`}</span>
          </div>
        )}
      </div>
    </MetricCardShell>
  );
};

export default GaugeCard;
