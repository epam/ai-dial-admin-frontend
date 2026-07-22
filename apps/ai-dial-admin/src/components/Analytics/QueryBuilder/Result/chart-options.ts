import { EChartsOption } from 'echarts-for-react/src/types';

import { CHART_COLOR } from '@/src/components/Common/MetricCard/constants';
import { renderCell } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { PIE_MAX_SLICES } from '@/src/constants/analytics/query-builder';
import { CHART_SERIES_COLOR_CYCLE } from '@/src/constants/analytics/query-builder-palette';
import { ChartBuildContext, ChartType, PieSlice } from '@/src/models/analytics/query-builder';

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

// Top-N pie slices by value; the remaining categories merge into one localized "Other" slice.
export const bucketTopSlices = (
  rows: ResultRows,
  categoryField: string,
  valueField: string,
  otherLabel: string,
  maxSlices: number = PIE_MAX_SLICES,
): PieSlice[] => {
  const slices = rows
    .map((row) => ({ name: renderCell(row[categoryField]), value: toNumber(row[valueField]) ?? 0 }))
    .sort((a, b) => b.value - a.value);
  if (slices.length <= maxSlices) return slices;
  const other = slices.slice(maxSlices).reduce((sum, s) => sum + s.value, 0);
  return [...slices.slice(0, maxSlices), { name: otherLabel, value: other }];
};

const TOOLTIP_STYLE = {
  backgroundColor: '#000000',
  borderColor: '#000000',
  borderWidth: 1,
  padding: [8, 12],
  textStyle: { color: CHART_COLOR.value, fontSize: 12 },
};

const baseOptions = (xData: string[], yField: string): EChartsOption => ({
  title: { show: false },
  tooltip: { trigger: 'axis', ...TOOLTIP_STYLE },
  xAxis: {
    type: 'category',
    data: xData,
    splitLine: { show: true, lineStyle: { color: CHART_COLOR.track, width: 1 } },
    axisLine: { show: false },
    axisTick: { show: false },
    // Long category values (resource paths, prompts…) get clipped to a fixed label width — the
    // tooltip still carries the full value.
    axisLabel: { color: CHART_COLOR.neutral, width: 120, overflow: 'truncate', hideOverlap: true },
  },
  yAxis: {
    type: 'value',
    name: yField,
    nameTextStyle: { color: CHART_COLOR.neutral, fontSize: 12, fontWeight: 500 },
    axisLabel: { color: CHART_COLOR.neutral },
    splitLine: { show: true, lineStyle: { color: CHART_COLOR.track, width: 1 } },
  },
  grid: { left: 40, right: 8, bottom: 24, top: 32, borderColor: '' },
  color: CHART_COLOR.accent,
});

const buildCartesianOptions = (
  type: ChartType,
  rows: ResultRows,
  xField: string,
  yField: string,
  yLabel: string = yField,
): EChartsOption => {
  const ordered = sortRowsByX(rows, xField);
  const xData = ordered.map((row) => renderCell(row[xField]));
  const yData = ordered.map((row) => toNumber(row[yField]));
  const options = baseOptions(xData, yLabel);

  if (type === ChartType.Bar) {
    options.series = [{ type: 'bar', data: yData, barMaxWidth: 48, itemStyle: { color: CHART_COLOR.accent } }];
    return options;
  }

  options.series = [{ type: 'line', data: yData, smooth: true }];
  return options;
};

export const buildBarChartOptions = (rows: ResultRows, xField: string, yField: string): EChartsOption =>
  buildCartesianOptions(ChartType.Bar, rows, xField, yField);

export const buildLineChartOptions = (rows: ResultRows, xField: string, yField: string): EChartsOption =>
  buildCartesianOptions(ChartType.Line, rows, xField, yField);

export const buildPieChartOptions = (
  rows: ResultRows,
  categoryField: string,
  valueField: string,
  otherLabel: string,
): EChartsOption => ({
  title: { show: false },
  tooltip: { trigger: 'item', ...TOOLTIP_STYLE },
  series: [
    {
      type: 'pie',
      radius: '70%',
      data: bucketTopSlices(rows, categoryField, valueField, otherLabel),
      label: { color: CHART_COLOR.neutral },
    },
  ],
  color: CHART_SERIES_COLOR_CYCLE,
});

// 'value' when every axis value is a plain number; 'time' otherwise — a scatter axis column is
// pre-filtered by getNumericColumns, so non-numeric means date-like strings.
const scatterAxisType = (rows: ResultRows, field: string): 'value' | 'time' =>
  rows.every((row) => toNumber(row[field]) !== null) ? 'value' : 'time';

const scatterAxis = (type: 'value' | 'time', name: string) => ({
  type,
  name,
  nameTextStyle: { color: CHART_COLOR.neutral, fontSize: 12, fontWeight: 500 },
  axisLine: { show: false },
  axisTick: { show: false },
  axisLabel: { color: CHART_COLOR.neutral, hideOverlap: true },
  splitLine: { show: true, lineStyle: { color: CHART_COLOR.track, width: 1 } },
});

export const buildScatterChartOptions = (
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
      ...TOOLTIP_STYLE,
      formatter: (params: { name?: string; value: unknown[] }) => {
        const head = params.name ? `${params.name}<br/>` : '';
        return `${head}${xLabel}: ${renderCell(params.value[0])}<br/>${yLabel}: ${renderCell(params.value[1])}`;
      },
    },
    xAxis: scatterAxis(xType, xLabel),
    yAxis: scatterAxis(yType, yLabel),
    grid: { left: 40, right: 24, bottom: 24, top: 32, borderColor: '' },
    series: [{ type: 'scatter', data: points, symbolSize: 10, itemStyle: { color: CHART_COLOR.accent } }],
  };
};

export const buildChartOptions = (
  type: ChartType,
  rows: ResultRows,
  xField: string,
  yField: string,
  context: ChartBuildContext,
): EChartsOption => {
  const label = (column: string): string => context.columnLabels[column] ?? column;
  if (type === ChartType.Pie) return buildPieChartOptions(rows, xField, yField, context.otherLabel);
  if (type === ChartType.Scatter) {
    return buildScatterChartOptions(rows, xField, yField, context.dimensionColumns, label(xField), label(yField));
  }
  return buildCartesianOptions(type, rows, xField, yField, label(yField));
};
