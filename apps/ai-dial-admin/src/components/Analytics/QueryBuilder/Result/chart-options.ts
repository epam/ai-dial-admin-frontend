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
    axisLabel: { color: CHART_COLOR.neutral },
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
  const xData = rows.map((row) => renderCell(row[xField]));
  const yData = rows.map((row) => toNumber(row[yField]));
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
