import { EChartsOption } from 'echarts-for-react/src/types';

import { renderCell } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { CHART_SERIES_COLOR_CYCLE } from '@/src/constants/analytics/query-builder-palette';
import { CHART_TOOLTIP_STYLE } from '@/src/constants/chart-tooltip';
import { ChartColors } from '@/src/components/Common/MetricCard/models';
import { ChartLegendEntry } from '@/src/components/Analytics/Usage/Charts/ChartLegend';
import { ChartBuildContext, ChartType } from '@/src/models/analytics/query-builder';

type ResultRows = Array<Record<string, unknown>>;

const toNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

// A sortable key for an X value: its numeric value, or its timestamp for date-like strings.
// null marks a value with no natural order (plain categories).
const comparableKey = (value: unknown): number | null => {
  const n = toNumber(value);
  if (n !== null) return n;
  if (typeof value === 'string') {
    const ts = Date.parse(value);
    return Number.isNaN(ts) ? null : ts;
  }
  return null;
};

// A query's sort order (e.g. top-N by count) is right for the table but reads wrong on an axis:
// when every X value is a number or a date, the chart re-orders the points along the axis instead
// of keeping row order. Mixed or plain-text X values keep the row order — there is nothing to sort by.
export const sortRowsByX = (rows: ResultRows, xField: string): ResultRows => {
  const keyed = rows.map((row) => ({ row, key: comparableKey(row[xField]) }));
  if (!keyed.length || keyed.some((k) => k.key === null)) return rows;
  return keyed.sort((a, b) => (a.key as number) - (b.key as number)).map((k) => k.row);
};

// Columns a scatter axis can plot: every value is numeric or date-like. Empty results yield no
// numeric columns — there is nothing to prove a column's kind with.
export const getNumericColumns = (rows: ResultRows, columns: string[]): string[] =>
  rows.length ? columns.filter((column) => rows.every((row) => comparableKey(row[column]) !== null)) : [];

// Stricter than `toNumber`, which coerces anything `Number()` accepts: `true` becomes 1 and an empty
// array becomes 0, so a boolean or an array-valued column (request_tags) would read as a measure.
export const strictNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export const getStrictNumericColumns = (rows: ResultRows, columns: string[]): string[] =>
  rows.length ? columns.filter((column) => rows.every((row) => strictNumber(row[column]) !== null)) : [];

// A blank category would draw an unlabeled bar or slice, so it reads as `emptyLabel` instead.
const renderCategory = (value: unknown, emptyLabel: string): string => renderCell(value) || emptyLabel;

const baseOptions = (colors: ChartColors, xData: string[], yName?: string): EChartsOption => ({
  title: { show: false },
  tooltip: { trigger: 'axis', ...CHART_TOOLTIP_STYLE },
  xAxis: {
    type: 'category',
    data: xData,
    splitLine: { show: true, lineStyle: { color: colors.track, width: 1 } },
    axisLine: { show: false },
    axisTick: { show: false },
    // Long category values (resource paths, prompts…) get clipped to a fixed label width — the
    // tooltip still carries the full value.
    axisLabel: { color: colors.neutral, width: 120, overflow: 'truncate', hideOverlap: true },
  },
  yAxis: {
    type: 'value',
    name: yName,
    nameTextStyle: { color: colors.neutral, fontSize: 12, fontWeight: 500 },
    axisLabel: { color: colors.neutral },
    splitLine: { show: true, lineStyle: { color: colors.track, width: 1 } },
  },
  grid: { left: 40, right: 8, bottom: 24, top: 32, borderColor: '' },
  color: colors.accent,
});

const buildCartesianOptions = (
  colors: ChartColors,
  type: ChartType,
  rows: ResultRows,
  xField: string,
  yFields: string[],
  label: (column: string) => string = (column) => column,
  emptyLabel = '',
): EChartsOption => {
  const ordered = sortRowsByX(rows, xField);
  const xData = ordered.map((row) => renderCategory(row[xField], emptyLabel));
  const isMultiSeries = yFields.length > 1;
  const options = baseOptions(colors, xData, isMultiSeries ? void 0 : label(yFields[0]));

  options.series = yFields.map((yField, index) => {
    const data = ordered.map((row) => toNumber(row[yField]));
    const color = isMultiSeries ? CHART_SERIES_COLOR_CYCLE[index % CHART_SERIES_COLOR_CYCLE.length] : colors.accent;
    const name = label(yField);
    if (type === ChartType.Bar) {
      const focus = isMultiSeries ? { emphasis: { focus: 'series' }, blur: { itemStyle: { opacity: 0.2 } } } : {};
      return { type: 'bar', name, data, barMaxWidth: 48, itemStyle: { color }, ...focus };
    }
    const lineStyle = isMultiSeries
      ? {
          itemStyle: { color },
          lineStyle: { color },
          emphasis: { focus: 'series' },
          blur: { lineStyle: { opacity: 0.2 }, itemStyle: { opacity: 0.2 } },
        }
      : {};
    return { type: 'line', name, data, smooth: true, ...lineStyle };
  });

  return options;
};

export const buildBarChartOptions = (
  colors: ChartColors,
  rows: ResultRows,
  xField: string,
  yFields: string[],
): EChartsOption => buildCartesianOptions(colors, ChartType.Bar, rows, xField, yFields);

export const buildLineChartOptions = (
  colors: ChartColors,
  rows: ResultRows,
  xField: string,
  yFields: string[],
): EChartsOption => buildCartesianOptions(colors, ChartType.Line, rows, xField, yFields);

// 'value' when every axis value is a plain number; 'time' otherwise — a scatter axis column is
// pre-filtered by getNumericColumns, so non-numeric means date-like strings.
const scatterAxisType = (rows: ResultRows, field: string): 'value' | 'time' =>
  rows.every((row) => toNumber(row[field]) !== null) ? 'value' : 'time';

const scatterAxis = (colors: ChartColors, type: 'value' | 'time', name: string) => ({
  type,
  name,
  nameTextStyle: { color: colors.neutral, fontSize: 12, fontWeight: 500 },
  axisLine: { show: false },
  axisTick: { show: false },
  axisLabel: { color: colors.neutral, hideOverlap: true },
  splitLine: { show: true, lineStyle: { color: colors.track, width: 1 } },
});

export const buildScatterChartOptions = (
  colors: ChartColors,
  rows: ResultRows,
  xField: string,
  yField: string,
  dimensionColumns: string[],
  xLabel: string = xField,
  yLabel: string = yField,
): EChartsOption => {
  const xType = scatterAxisType(rows, xField);
  const yType = scatterAxisType(rows, yField);
  const axisValue = (value: unknown, type: 'value' | 'time') => (type === 'value' ? toNumber(value) : value);

  // One point per row (= one group), in query row order — point order is invisible on a scatter.
  // The point name carries the row's dimension values so groups stay identifiable in the tooltip.
  const points = rows
    .map((row) => ({
      name: dimensionColumns.map((d) => renderCell(row[d])).join(' · '),
      value: [axisValue(row[xField], xType), axisValue(row[yField], yType)],
    }))
    .filter((p) => p.value[0] !== null && p.value[0] !== undefined && p.value[1] !== null && p.value[1] !== undefined);

  return {
    title: { show: false },
    tooltip: {
      trigger: 'item',
      ...CHART_TOOLTIP_STYLE,
      formatter: (params: { name?: string; value: unknown[] }) => {
        const head = params.name ? `${params.name}<br/>` : '';
        return `${head}${xLabel}: ${renderCell(params.value[0])}<br/>${yLabel}: ${renderCell(params.value[1])}`;
      },
    },
    xAxis: scatterAxis(colors, xType, xLabel),
    yAxis: scatterAxis(colors, yType, yLabel),
    grid: { left: 40, right: 24, bottom: 24, top: 32, borderColor: '' },
    series: [{ type: 'scatter', data: points, symbolSize: 10, itemStyle: { color: colors.accent } }],
  };
};

export const buildChartOptions = (
  type: ChartType,
  rows: ResultRows,
  xField: string,
  yFields: string[],
  context: ChartBuildContext,
): EChartsOption => {
  const label = (column: string): string => context.columnLabels[column] ?? column;
  const [yField] = yFields;
  if (type === ChartType.Scatter) {
    return buildScatterChartOptions(
      context.colors,
      rows,
      xField,
      yField,
      context.dimensionColumns,
      label(xField),
      label(yField),
    );
  }
  return buildCartesianOptions(context.colors, type, rows, xField, yFields, label, context.emptyLabel);
};

interface CartesianSeries {
  type?: string;
  name?: string;
  itemStyle?: { color?: string };
}

export const buildSeriesLegend = (options: EChartsOption | null): ChartLegendEntry[] => {
  const series: CartesianSeries[] = Array.isArray(options?.series) ? options.series : [];
  const isCartesian = series.every((entry) => entry.type === 'bar' || entry.type === 'line');
  if (series.length < 2 || !isCartesian) return [];
  return series.map((entry, index) => ({
    id: `${index}-${entry.name ?? ''}`,
    label: entry.name ?? '',
    color: entry.itemStyle?.color,
    seriesIndex: index,
  }));
};
