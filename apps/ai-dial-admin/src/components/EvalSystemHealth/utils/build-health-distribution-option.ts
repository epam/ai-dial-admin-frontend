import { EChartsOption } from 'echarts-for-react/src/types';

import { formatPercent } from '@/src/components/Analytics/Usage/utils/format';
import { ChartColors } from '@/src/components/Common/MetricCard/models';
import { HealthDistributionBar } from '@/src/components/EvalSystemHealth/models';
import { CHART_TOOLTIP_STYLE } from '@/src/constants/chart-tooltip';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';

type Translate = (key: string, params?: Record<string, string | number>) => string;

const Y_AXIS_MAX = 100;
const Y_AXIS_INTERVAL = 25;
const BAR_MAX_WIDTH = 64;
const STACK = 'share';

interface AxisTooltipParam {
  dataIndex: number;
}

const swatch = (color: string): string =>
  `<span style="display:inline-block;width:8px;height:8px;margin-right:6px;border-radius:2px;background-color:${color}"></span>`;

/**
 * The tooltip of one bar: the week, then each band's suite count and share. The bars draw no figure of their
 * own, so this is where a week's percentages are read. A week with no suite has nothing to state, and an empty
 * string keeps ECharts from showing a tooltip at all.
 */
const buildTooltipFormatter =
  (bars: HealthDistributionBar[], colors: ChartColors, t: Translate) =>
  (params: AxisTooltipParam[]): string => {
    const bar = bars[params[0]?.dataIndex];
    if (!bar || bar.healthyShare == null || bar.failingShare == null) {
      return '';
    }

    return [
      t(EvalSystemHealthI18nKey.HealthDistributionTooltipWeek, { date: bar.label }),
      `${swatch(colors.success)}${t(EvalSystemHealthI18nKey.HealthDistributionTooltipHealthy, {
        count: bar.healthyCount,
        share: formatPercent(bar.healthyShare / 100),
      })}`,
      `${swatch(colors.error)}${t(EvalSystemHealthI18nKey.HealthDistributionTooltipFail, {
        count: bar.failingCount,
        share: formatPercent(bar.failingShare / 100),
      })}`,
    ].join('<br/>');
  };

/**
 * The 100%-stacked bars: one category per week on a fixed 0–100 axis, the failing band at the bottom and the
 * healthy one above it as in the design mock. A `null` share draws no bar but keeps the week's place on the
 * axis. Nothing is labelled on the bars; the tooltip carries the figures.
 */
export const buildHealthDistributionOption = (
  bars: HealthDistributionBar[],
  colors: ChartColors,
  t: Translate,
): EChartsOption => ({
  grid: { left: 40, right: 8, top: 8, bottom: 24 },
  xAxis: {
    type: 'category',
    data: bars.map((bar) => bar.label),
    axisTick: { show: false },
    axisLine: { lineStyle: { color: colors.neutral } },
    axisLabel: { color: colors.neutral, fontSize: 13 },
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: Y_AXIS_MAX,
    interval: Y_AXIS_INTERVAL,
    axisLabel: { color: colors.neutral, fontSize: 13, formatter: (value: number) => `${value}%` },
    splitLine: { lineStyle: { color: `${colors.value}12` } },
  },
  tooltip: {
    ...CHART_TOOLTIP_STYLE,
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: buildTooltipFormatter(bars, colors, t),
  },
  animation: false,
  series: [
    {
      type: 'bar',
      name: 'fail',
      stack: STACK,
      barMaxWidth: BAR_MAX_WIDTH,
      itemStyle: { color: colors.error },
      label: { show: false },
      data: bars.map((bar) => bar.failingShare),
    },
    {
      type: 'bar',
      name: 'healthy',
      stack: STACK,
      barMaxWidth: BAR_MAX_WIDTH,
      itemStyle: { color: colors.success },
      label: { show: false },
      data: bars.map((bar) => bar.healthyShare),
    },
  ],
});
