import { EChartsOption } from 'echarts-for-react/src/types';

import { CHART_COLOR } from '@/src/components/Common/MetricCard/constants';
import { BucketPoint } from '@/src/components/Analytics/Usage/models';
import { GROUPING_LOCALE } from '@/src/components/Analytics/Usage/utils/format';

const GRID_LINE_COLOR = 'rgba(238, 241, 247, .07)';

const axisLabelStyle = { color: CHART_COLOR.neutral, fontSize: 13 };

/**
 * The calls and split lines downsample for drawing rather than for fetching; the latency lines do
 * not, because sampling bridges the gaps they must keep. The window decides how many buckets
 * are asked for; how many of them a plot can separate is its own width's business, and resolving
 * that in the request meant a browser resize re-issued the page's data.
 */
const LINE_SAMPLING = 'lttb' as const;

/** What a tooltip prints where the series holds no figure for that bucket. */
const NO_FIGURE = '—';

/**
 * Every figure a chart prints — axis tick, tooltip, legend — is rounded here. The raw values carry
 * full float precision (a spend of 20.50087114, a latency of 9149.517302573204) and ECharts renders
 * them verbatim otherwise.
 */
export const formatChartNumber = (value: number, maximumFractionDigits = 2): string =>
  value.toLocaleString(GROUPING_LOCALE, { maximumFractionDigits });

/**
 * A tooltip prints one figure large, where a third decimal is noise rather than precision, so it
 * rounds harder than an axis tick. ECharts hands the formatter whatever the series holds, including
 * the null a latency series uses for a bucket with no calls.
 */
const tooltipValueFormatter = (value: unknown): string =>
  typeof value === 'number' ? formatChartNumber(value, 1) : NO_FIGURE;

const valueAxis = {
  type: 'value' as const,
  // `hideOverlap` so a short plot drops ticks instead of stacking them into an unreadable block.
  axisLabel: { ...axisLabelStyle, hideOverlap: true, formatter: (value: number) => formatChartNumber(value) },
  splitLine: { lineStyle: { color: GRID_LINE_COLOR } },
};

/**
 * ECharts renders its tooltip as a real DOM node, so the theme's own CSS variables reach it — the
 * default light panel is what made every tooltip on this dark page white. The axis pointer is drawn
 * into the chart instead and needs a literal colour.
 */
const TOOLTIP_STYLE = {
  backgroundColor: 'var(--bg-layer-3)',
  borderColor: 'var(--stroke-primary)',
  borderWidth: 1,
  padding: [6, 10],
  textStyle: { color: 'var(--text-primary)', fontSize: 12 },
  extraCssText: 'border-radius:4px;box-shadow:0 4px 12px rgba(12,16,29,.45);',
};

interface AxisTooltipParam {
  axisValue: string;
  dataIndex: number;
  /**
   * What the series holds for this bucket, which is not always the figure: a series may carry an
   * object per point rather than a number. `value` is the figure in both shapes, so it is read
   * first, and `data` is the fallback.
   */
  value?: number | null;
  data: number | null | { value: number | null };
  /** ECharts' own colour dot for the series, as an HTML fragment. */
  marker?: string;
  seriesName?: string;
}

const readFigure = (param: AxisTooltipParam): unknown => {
  if (param.value != null) {
    return param.value;
  }

  return typeof param.data === 'object' && param.data !== null ? param.data.value : param.data;
};

/**
 * A tooltip's heading: the period the hovered bucket covers, where the caller states one, and the
 * axis label otherwise. The axis itself carries only the start — it has one line per tick — so the
 * period lives here, where there is room to name both ends.
 */
const tooltipHeading = (params: AxisTooltipParam[], periods?: string[]): string =>
  periods?.[params[0].dataIndex] ?? params[0].axisValue;

const axisTooltip =
  (periods?: string[], isNamingSeries = false) =>
  (params: AxisTooltipParam[]): string =>
    [
      tooltipHeading(params, periods),
      ...params.map((param) => {
        const name = isNamingSeries ? `${param.marker ?? ''}${param.seriesName ?? ''} ` : '';

        return `${name}<b>${tooltipValueFormatter(readFigure(param))}</b>`;
      }),
    ].join('<br/>');

interface ItemTooltipParam {
  /** ECharts' own colour dot for the hovered slice, as an HTML fragment. */
  marker: string;
  name: string;
  value: number;
  data: DonutSlice;
}

const formatTooltipValue = (value: number): string => `<b>${formatChartNumber(value)}</b>`;

const axisPointerStyle = { color: CHART_COLOR.neutral, width: 1, type: 'dashed' as const };

export const LATENCY_P50_COLOR = '#7FCFC4';
export const LATENCY_P95_COLOR = '#B49BE8';

export const buildTimeSeriesOptions = (
  points: BucketPoint[],
  formatBucket: (bucketMs: number) => string,
  periods?: string[],
): EChartsOption => ({
  grid: { left: 58, right: 8, top: 16, bottom: 32 },
  xAxis: {
    type: 'category',
    data: points.map((point) => formatBucket(point.bucketMs)),
    boundaryGap: false,
    axisLabel: { ...axisLabelStyle, hideOverlap: true },
    axisLine: { lineStyle: { color: GRID_LINE_COLOR } },
    axisTick: { show: false },
  },
  yAxis: valueAxis,
  tooltip: {
    ...TOOLTIP_STYLE,
    trigger: 'axis',
    axisPointer: { type: 'line', lineStyle: axisPointerStyle },
    // A single series needs no colour marker to say which one it is.
    formatter: axisTooltip(periods),
  },
  animation: false,
  series: [
    {
      type: 'line',
      color: CHART_COLOR.accent,
      data: points.map((point) => point.measures.calls),
      showSymbol: false,
      sampling: LINE_SAMPLING,
      lineStyle: { width: 1.5, color: CHART_COLOR.accent },
      areaStyle: { color: CHART_COLOR.accent, opacity: 0.12 },
    },
  ],
});

export interface NamedSeries {
  id: string;
  label: string;
  color: string;
  values: number[];
}

export const buildSplitSeriesOptions = (
  labels: string[],
  series: NamedSeries[],
  periods?: string[],
): EChartsOption => ({
  grid: { left: 58, right: 8, top: 16, bottom: 32 },
  xAxis: {
    type: 'category',
    data: labels,
    boundaryGap: false,
    axisLabel: { ...axisLabelStyle, hideOverlap: true },
    axisLine: { lineStyle: { color: GRID_LINE_COLOR } },
    axisTick: { show: false },
  },
  yAxis: valueAxis,
  tooltip: {
    ...TOOLTIP_STYLE,
    trigger: 'axis',
    axisPointer: { type: 'line', lineStyle: axisPointerStyle },
    formatter: axisTooltip(periods, true),
  },
  animation: false,
  /*
   * Not stacked. A stack draws every series at its cumulative height, so the topmost line traces
   * the bucket total and is read as that series' own figure — a model credited with the whole
   * window's spike while the donut beside it states a fraction of that. Each series now draws
   * itself from a shared zero: the value comes off the axis, the spike belongs to whoever caused
   * it, and the total is still a tab away on `Requests`.
   */
  series: series.map((entry) => ({
    type: 'line',
    name: entry.label,
    color: entry.color,
    data: entry.values,
    showSymbol: false,
    sampling: LINE_SAMPLING,
    lineStyle: { width: 1.5, color: entry.color },
    // Faint, because unstacked areas overlap where a stack's never did.
    areaStyle: { color: entry.color, opacity: 0.1 },
    emphasis: { focus: 'series' },
    blur: { lineStyle: { opacity: 0.2 }, areaStyle: { opacity: 0.03 } },
  })),
});

export const buildBarOptions = (labels: string[], values: number[], periods?: string[]): EChartsOption => ({
  grid: { left: 58, right: 8, top: 16, bottom: 32 },
  xAxis: {
    type: 'category',
    data: labels,
    axisLabel: { ...axisLabelStyle, hideOverlap: true },
    axisLine: { lineStyle: { color: GRID_LINE_COLOR } },
    axisTick: { show: false },
  },
  yAxis: valueAxis,
  tooltip: {
    ...TOOLTIP_STYLE,
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    formatter: axisTooltip(periods),
  },
  animation: false,
  series: [
    {
      type: 'bar',
      // Every bar the same: they answer one question, and toning one of them made it read as the
      // answer while the rest read as context.
      itemStyle: { color: CHART_COLOR.accent },
      data: values,
    },
  ],
});

export const buildLatencyOptions = (
  labels: string[],
  p50: (number | null)[],
  p95: (number | null)[],
  periods?: string[],
): EChartsOption => ({
  grid: { left: 58, right: 8, top: 16, bottom: 32 },
  xAxis: {
    type: 'category',
    data: labels,
    boundaryGap: false,
    axisLabel: { ...axisLabelStyle, hideOverlap: true },
    axisLine: { lineStyle: { color: GRID_LINE_COLOR } },
    axisTick: { show: false },
  },
  yAxis: valueAxis,
  tooltip: {
    ...TOOLTIP_STYLE,
    trigger: 'axis',
    axisPointer: { type: 'line', lineStyle: axisPointerStyle },
    formatter: axisTooltip(periods, true),
  },
  animation: false,
  series: [
    {
      type: 'line',
      name: 'p50',
      // The tooltip's marker and the legend read the series' own colour; `lineStyle` paints the
      // line and nothing else, so stating it there alone left the markers on ECharts' palette.
      color: LATENCY_P50_COLOR,
      data: p50,
      showSymbol: false,
      // Neither sampled nor bridged: a bucket with no calls has no percentile, and joining across
      // it drew a flat line through hours the platform was idle — a reading the window never took.
      // `lttb` removes points to fit the pixels, gaps included, so it would bridge them too.
      connectNulls: false,
      lineStyle: { width: 1.5, color: LATENCY_P50_COLOR },
      emphasis: { focus: 'series' },
      blur: { lineStyle: { opacity: 0.2 } },
    },
    {
      type: 'line',
      name: 'p95',
      color: LATENCY_P95_COLOR,
      data: p95,
      showSymbol: false,
      connectNulls: false,
      lineStyle: { width: 1.5, color: LATENCY_P95_COLOR },
      emphasis: { focus: 'series' },
      blur: { lineStyle: { opacity: 0.2 } },
    },
  ],
});

export interface DonutSlice {
  name: string;
  value: number;
  itemStyle: { color: string };
  /**
   * The slice's share of the window total, already formatted. ECharts' own `percent` divides by the
   * sum of the plotted slices, and the plotted set is one page of rows — a different, larger share
   * than the legend's, which is why the two disagreed.
   */
  shareLabel?: string;
}

/**
 * Read in order, so the nth slice and the nth legend swatch are the same colour. The residual keeps
 * grey whatever its position, which is why it is not simply the last entry here.
 *
 * Mid-tone chromatic hues rather than either the stock chart colours or a wash of pastels: a dozen
 * saturated segments on a dark page read as noise, and desaturating them far enough to settle down
 * leaves the ring looking dusty. These sit between — Serenity, Living Coral, Neo Mint, Ultra Violet
 * and their neighbours, lifted where the published value is too dark to hold against `bg-layer-2`.
 * Adjacent entries change hue family, which is what keeps thin segments apart.
 */
export const SLICE_COLORS = [
  '#92A8D1',
  '#FF8578',
  '#7ED3B2',
  '#8A74BE',
  '#FDAC53',
  '#88B04B',
  '#D65C7A',
  '#7BC4C4',
  '#FFBE98',
  '#8384C9',
  '#F7CAC9',
  '#C4A66B',
];

export const OTHER_SLICE_COLOR = CHART_COLOR.neutral;

export const getSliceColor = (index: number, isOther: boolean): string =>
  isOther ? OTHER_SLICE_COLOR : SLICE_COLORS[index % SLICE_COLORS.length];

/** How far the slices the cursor is not on fade, so the one it is on reads as the answer. */
const DONUT_BLUR_OPACITY = 0.25;

/**
 * The donut fills its own square box and draws nothing but the ring: the total in the hole and the
 * legend under it are HTML, centred by layout. ECharts' own `title` is anchored by a corner, so
 * `left: 'center'` and `textAlign` fight each other and land the text off the middle; its legend is
 * pinned to an edge of the canvas, which left a void beside the ring on a wide card.
 */
export const buildDonutOptions = (slices: DonutSlice[]): EChartsOption => ({
  tooltip: {
    ...TOOLTIP_STYLE,
    trigger: 'item',
    formatter: ({ marker, name, value, data }: ItemTooltipParam) => {
      const share = data.shareLabel ? ` (${data.shareLabel})` : '';

      return `${marker}${name}<br/>${formatTooltipValue(value)}${share}`;
    },
  },
  animation: false,
  legend: { show: false },
  series: [
    {
      type: 'pie',
      radius: ['68%', '92%'],
      center: ['50%', '50%'],
      label: { show: false },
      labelLine: { show: false },
      // Hovering answers "which slice is this", so the slice under the cursor keeps its colour and
      // the rest fade. Scaling it as well moved the ring's edge under the cursor, which reads as
      // the pointer having hit something else.
      emphasis: { focus: 'self', scale: false },
      blur: { itemStyle: { opacity: DONUT_BLUR_OPACITY } },
      data: slices,
    },
  ],
});
