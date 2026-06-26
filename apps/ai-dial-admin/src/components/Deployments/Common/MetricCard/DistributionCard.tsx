import ReactECharts from 'echarts-for-react';
import { FC, useMemo } from 'react';

import MetricCardShell from '@/src/components/Common/MetricCard/MetricCardShell';
import { CHART_COLOR, STATUS_COLOR } from '@/src/components/Common/MetricCard/constants';
import { MetricStatus } from '@/src/components/Common/MetricCard/models';
import { DistributionSummary } from '@/src/models/deployments/metrics';

interface Props {
  title: string;
  distribution: DistributionSummary | null;
  loading: boolean;
  unit?: string;
  status?: MetricStatus;
  emptyReason?: string;
}

const DistributionCard: FC<Props> = ({
  title,
  distribution,
  loading,
  unit = '',
  status = MetricStatus.Neutral,
  emptyReason,
}) => {
  const hasPercentiles = [distribution?.p50, distribution?.p95, distribution?.p99].some(
    (v) => v !== null && v !== undefined,
  );
  // Empty only when nothing is plottable; a mean-only summary still renders (as a single bar).
  const isEmpty =
    !distribution || [distribution.p50, distribution.p95, distribution.p99, distribution.mean].every((v) => v === null);

  const option = useMemo(() => {
    const round = (v: number | null | undefined) => (v === null || v === undefined ? 0 : Math.round(v * 100) / 100);
    // Prefer the percentile breakdown; fall back to a single mean bar when percentiles are absent.
    const categories = hasPercentiles ? ['p99', 'p95', 'p50'] : ['mean'];
    const data = hasPercentiles
      ? [round(distribution?.p99), round(distribution?.p95), round(distribution?.p50)]
      : [round(distribution?.mean)];

    return {
      grid: { left: 32, right: 36, top: 4, bottom: 4 },
      xAxis: { type: 'value', show: false },
      yAxis: {
        type: 'category',
        data: categories,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: CHART_COLOR.neutral, fontSize: 11 },
      },
      series: [
        {
          type: 'bar',
          barWidth: '55%',
          itemStyle: { color: STATUS_COLOR[status], borderRadius: 2 },
          label: {
            show: true,
            position: 'right',
            color: CHART_COLOR.value,
            fontSize: 12,
            formatter: (p: { value: number }) => `${p.value}${unit}`,
          },
          data,
        },
      ],
    };
  }, [distribution, status, unit, hasPercentiles]);

  return (
    <MetricCardShell title={title} loading={loading} isEmpty={isEmpty} emptyReason={emptyReason} status={status}>
      <ReactECharts option={option} style={{ height: 110, width: '100%' }} notMerge lazyUpdate />
    </MetricCardShell>
  );
};

export default DistributionCard;
