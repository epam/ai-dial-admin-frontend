import { EChartsOption } from 'echarts-for-react/src/types';

import { CHART_COLOR } from '@/src/components/Common/MetricCard/constants';
import { renderCell } from '@/src/components/Analytics/QueryBuilder/utils/result';
import { ChartType } from '@/src/models/analytics/query-builder';

type ResultRows = Array<Record<string, unknown>>;

const AREA_FILL_ALPHA = '2B';

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

const baseOptions = (xData: string[], yField: string): EChartsOption => ({
  title: { show: false },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#000000',
    borderColor: '#000000',
    borderWidth: 1,
    padding: [8, 12],
    textStyle: { color: CHART_COLOR.value, fontSize: 12 },
  },
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

const buildOptions = (type: ChartType, rows: ResultRows, xField: string, yField: string): EChartsOption => {
  const ordered = sortRowsByX(rows, xField);
  const xData = ordered.map((row) => renderCell(row[xField]));
  const yData = ordered.map((row) => toNumber(row[yField]));
  const options = baseOptions(xData, yField);

  if (type === ChartType.Bar) {
    options.series = [{ type: 'bar', data: yData, barMaxWidth: 48, itemStyle: { color: CHART_COLOR.accent } }];
    return options;
  }

  options.series = [
    {
      type: 'line',
      data: yData,
      smooth: true,
      ...(type === ChartType.Area ? { areaStyle: { color: `${CHART_COLOR.accent}${AREA_FILL_ALPHA}` } } : {}),
    },
  ];
  return options;
};

export const buildBarChartOptions = (rows: ResultRows, xField: string, yField: string): EChartsOption =>
  buildOptions(ChartType.Bar, rows, xField, yField);

export const buildLineChartOptions = (rows: ResultRows, xField: string, yField: string): EChartsOption =>
  buildOptions(ChartType.Line, rows, xField, yField);

export const buildAreaChartOptions = (rows: ResultRows, xField: string, yField: string): EChartsOption =>
  buildOptions(ChartType.Area, rows, xField, yField);

export const buildChartOptions = buildOptions;
