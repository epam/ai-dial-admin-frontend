import { EChartsOption } from 'echarts-for-react/src/types';

import { renderCell } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { DonutSliceView } from '@/src/components/Analytics/Usage/models';
import { PIE_MAX_SLICES } from '@/src/constants/analytics/query-builder';
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

export interface SplitSeries {
  name: string;
  data: Array<number | null>;
}

export interface SplitPivot {
  xData: string[];
  series: SplitSeries[];
}

interface SplitLabels {
  otherLabel: string;
}

const sumInto = (current: number | null, value: number | null): number | null =>
  value === null ? current : (current ?? 0) + value;

export const pivotSplitSeries = (
  rows: ResultRows,
  xField: string,
  yField: string,
  splitField: string,
  { otherLabel }: SplitLabels,
  maxSeries = PIE_MAX_SLICES,
): SplitPivot => {
  const ordered = sortRowsByX(rows, xField);
  const xData = [...new Set(ordered.map((row) => renderCell(row[xField])))];
  const xIndex = new Map(xData.map((x, index) => [x, index]));

  const bySplit = new Map<string, Array<number | null>>();
  ordered.forEach((row) => {
    const name = renderCell(row[splitField]);
    const data = bySplit.get(name) ?? xData.map(() => null);
    const index = xIndex.get(renderCell(row[xField])) as number;
    data[index] = sumInto(data[index], toNumber(row[yField]));
    bySplit.set(name, data);
  });

  const total = (data: Array<number | null>) => data.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const ranked = [...bySplit.entries()]
    .map(([name, data]) => ({ name, data }))
    .sort((a, b) => total(b.data) - total(a.data));
  const shown = ranked.slice(0, maxSeries);
  const rest = ranked.slice(maxSeries);
  if (!rest.length) return { xData, series: shown };

  const other = xData.map((_, index) =>
    rest.reduce<number | null>((sum, entry) => sumInto(sum, entry.data[index]), null),
  );
  return { xData, series: [...shown, { name: otherLabel, data: other }] };
};

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

const CATEGORY_LABEL_MAX_WIDTH = 120;
const CATEGORY_LABEL_CHAR_WIDTH = 7;
const CATEGORY_LABEL_ROTATE = 45;

interface CategoryAxis {
  type?: string;
  data?: unknown[];
  axisLabel?: Record<string, unknown>;
}

export const fitCategoryLabels = (options: EChartsOption, width: number): EChartsOption => {
  const xAxis = options.xAxis as CategoryAxis | undefined;
  if (!width || xAxis?.type !== 'category' || !xAxis.data?.length) return options;
  const longest = Math.max(...xAxis.data.map((value) => String(value ?? '').length));
  const labelWidth = Math.min(CATEGORY_LABEL_MAX_WIDTH, longest * CATEGORY_LABEL_CHAR_WIDTH);
  const isRotated = labelWidth > width / xAxis.data.length;
  const grid = options.grid as { bottom?: number } | undefined;
  return {
    ...options,
    xAxis: {
      ...xAxis,
      axisLabel: { ...xAxis.axisLabel, interval: 0, rotate: isRotated ? CATEGORY_LABEL_ROTATE : 0 },
    },
    grid: isRotated ? { ...grid, bottom: (grid?.bottom ?? 0) + Math.round(labelWidth * Math.SQRT1_2) } : grid,
  };
};

const seriesColor = (index: number) => CHART_SERIES_COLOR_CYCLE[index % CHART_SERIES_COLOR_CYCLE.length];

const buildSplitOptions = (
  colors: ChartColors,
  type: ChartType,
  rows: ResultRows,
  xField: string,
  yField: string,
  splitField: string,
  label: (column: string) => string,
  labels: SplitLabels,
): EChartsOption => {
  const { xData, series } = pivotSplitSeries(rows, xField, yField, splitField, labels);
  const options = baseOptions(colors, xData, label(yField));
  const blur = { blur: { itemStyle: { opacity: 0.2 }, lineStyle: { opacity: 0.2 } }, emphasis: { focus: 'series' } };
  options.series = series.map((entry, index) => {
    const color = seriesColor(index);
    if (type === ChartType.Bar) {
      return { type: 'bar', name: entry.name, data: entry.data, barMaxWidth: 48, itemStyle: { color }, ...blur };
    }
    if (type === ChartType.Scatter) {
      return { type: 'scatter', name: entry.name, data: entry.data, symbolSize: 10, itemStyle: { color }, ...blur };
    }
    return {
      type: 'line',
      name: entry.name,
      data: entry.data,
      smooth: true,
      itemStyle: { color },
      lineStyle: { color },
      ...blur,
    };
  });
  return options;
};

const buildCartesianOptions = (
  colors: ChartColors,
  type: ChartType,
  rows: ResultRows,
  xField: string,
  yFields: string[],
  label: (column: string) => string = (column) => column,
  splitField: string | null = null,
  otherLabel = '',
): EChartsOption => {
  if (splitField) {
    return buildSplitOptions(colors, type, rows, xField, yFields[0], splitField, label, { otherLabel });
  }
  const ordered = sortRowsByX(rows, xField);
  const xData = ordered.map((row) => renderCell(row[xField]));
  const isMultiSeries = yFields.length > 1;
  const options = baseOptions(colors, xData, isMultiSeries ? void 0 : label(yFields[0]));

  options.series = yFields.map((yField, index) => {
    const data = ordered.map((row) => toNumber(row[yField]));
    const color = isMultiSeries ? seriesColor(index) : colors.accent;
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
  if (type === ChartType.Scatter && !context.splitField) {
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
  return buildCartesianOptions(
    context.colors,
    type,
    rows,
    xField,
    yFields,
    label,
    context.splitField ?? null,
    context.otherLabel,
  );
};

export const buildPieOptions = (colors: ChartColors, slices: DonutSliceView[]): EChartsOption => ({
  title: { show: false },
  tooltip: { trigger: 'item', ...CHART_TOOLTIP_STYLE, formatter: '{b}: {c}' },
  series: [
    {
      type: 'pie',
      radius: ['0%', '80%'],
      data: slices.map((slice) => ({ name: slice.label, value: slice.value, itemStyle: { color: slice.color } })),
      label: { show: false },
      labelLine: { show: false },
    },
  ],
});

interface CartesianSeries {
  type?: string;
  name?: string;
  itemStyle?: { color?: string };
}

interface PieSlice {
  name?: string;
  itemStyle?: { color?: string };
}

interface PieSeries {
  type?: string;
  data?: PieSlice[];
}

export const buildSeriesLegend = (options: EChartsOption | null): ChartLegendEntry[] => {
  const [first]: PieSeries[] = Array.isArray(options?.series) ? options.series : [];
  if (first?.type === 'pie') {
    return (first.data ?? []).map((slice, index) => ({
      id: `${index}-${slice.name ?? ''}`,
      label: slice.name ?? '',
      color: slice.itemStyle?.color,
    }));
  }
  const series: CartesianSeries[] = Array.isArray(options?.series) ? options.series : [];
  const isCartesian = series.every(
    (entry) => entry.type === 'bar' || entry.type === 'line' || entry.type === 'scatter',
  );
  if (series.length < 2 || !isCartesian) return [];
  return series.map((entry, index) => ({
    id: `${index}-${entry.name ?? ''}`,
    label: entry.name ?? '',
    color: entry.itemStyle?.color,
    seriesIndex: index,
  }));
};
