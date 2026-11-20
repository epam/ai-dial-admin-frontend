import { describe, expect, test } from 'vitest';

import {
  buildChartOptions,
  buildPieOptions,
  buildSeriesLegend,
  pivotSplitSeries,
} from '@/src/components/Analytics/QueryBuilder/Result/chart-options';
import { getChartColors } from '@/src/components/Common/MetricCard/utils';
import { CHART_SERIES_COLOR_CYCLE } from '@/src/constants/analytics/query-builder-palette';
import { ChartType } from '@/src/models/analytics/query-builder';
import { fallbackDarkTheme } from '@/src/utils/themes/constant';

const COLORS = getChartColors(fallbackDarkTheme);
const LABELS = { otherLabel: 'Other' };

const ROWS = [
  { bucket: '2026-11-13T10:00:00Z', sentiment: 'neutral', n: 14 },
  { bucket: '2026-11-13T09:45:00Z', sentiment: 'positive', n: 9 },
  { bucket: '2026-11-13T09:45:00Z', sentiment: 'neutral', n: 4 },
  { bucket: '2026-11-13T10:00:00Z', sentiment: 'mixed', n: 6 },
];

const CONTEXT = {
  colors: COLORS,
  dimensionColumns: ['bucket', 'sentiment'],
  otherLabel: 'Other',
  columnLabels: {},
  splitField: 'sentiment',
};

describe('pivotSplitSeries', () => {
  test('makes one series per split value over the X values in axis order, largest total first', () => {
    const pivot = pivotSplitSeries(ROWS, 'bucket', 'n', 'sentiment', LABELS);

    expect(pivot.xData).toEqual(['2026-11-13T09:45:00Z', '2026-11-13T10:00:00Z']);
    expect(pivot.series).toEqual([
      { name: 'neutral', data: [4, 14] },
      { name: 'positive', data: [9, null] },
      { name: 'mixed', data: [null, 6] },
    ]);
  });

  test('leaves a gap for an X value a series has no row for', () => {
    const { series } = pivotSplitSeries(ROWS, 'bucket', 'n', 'sentiment', LABELS);

    expect(series.find((entry) => entry.name === 'positive')?.data[1]).toBeNull();
  });

  test('merges the values past the cap into one Other series', () => {
    const rows = ['a', 'b', 'c'].map((sentiment, index) => ({ bucket: 'x', sentiment, n: 3 - index }));
    const { series } = pivotSplitSeries(rows, 'bucket', 'n', 'sentiment', LABELS, 2);

    expect(series.map((entry) => entry.name)).toEqual(['a', 'b', 'Other']);
    expect(series[2].data).toEqual([1]);
  });

  test('leaves a blank split value unnamed and sums repeated rows', () => {
    const rows = [
      { bucket: 'x', sentiment: '', n: 2 },
      { bucket: 'x', sentiment: null, n: 3 },
    ];

    expect(pivotSplitSeries(rows, 'bucket', 'n', 'sentiment', LABELS).series).toEqual([{ name: '', data: [5] }]);
  });
});

describe('buildChartOptions with a split', () => {
  test.each([
    [ChartType.Line, 'line'],
    [ChartType.Bar, 'bar'],
    [ChartType.Scatter, 'scatter'],
  ])('draws a %s chart as one %s series per split value on a category axis', (type, seriesType) => {
    const options = buildChartOptions(type, ROWS, 'bucket', ['n'], CONTEXT);

    expect(options.xAxis.type).toBe('category');
    expect(options.tooltip.trigger).toBe('axis');
    expect(options.series.map((entry: { type: string }) => entry.type)).toEqual([seriesType, seriesType, seriesType]);
    expect(options.series[0].itemStyle.color).toBe(CHART_SERIES_COLOR_CYCLE[0]);
  });

  test('keeps the numeric scatter when there is no split', () => {
    const rows = [{ a: 1, b: 2 }];
    const options = buildChartOptions(ChartType.Scatter, rows, 'a', ['b'], { ...CONTEXT, splitField: null });

    expect(options.xAxis.type).toBe('value');
  });

  test('legends every split series', () => {
    const options = buildChartOptions(ChartType.Line, ROWS, 'bucket', ['n'], CONTEXT);

    expect(buildSeriesLegend(options).map((entry) => entry.label)).toEqual(['neutral', 'positive', 'mixed']);
  });
});

describe('buildPieOptions', () => {
  const slices = [
    { id: 'coding', label: 'coding', value: 94, isOther: false, valueLabel: '94', shareLabel: null, color: '#111' },
    { id: 'writing', label: 'writing', value: 6, isOther: false, valueLabel: '6', shareLabel: null, color: '#222' },
  ];

  test('draws a full pie with outside labels and leader lines', () => {
    const [series] = buildPieOptions(COLORS, slices).series;

    expect(series.type).toBe('pie');
    expect(series.radius[0]).toBe('0%');
    expect(series.label.show).toBe(true);
    expect(series.labelLine.show).toBe(true);
    expect(series.data).toEqual([
      { name: 'coding', value: 94, itemStyle: { color: '#111' } },
      { name: 'writing', value: 6, itemStyle: { color: '#222' } },
    ]);
  });

  test('legends each slice with its colour', () => {
    expect(buildSeriesLegend(buildPieOptions(COLORS, slices))).toEqual([
      { id: '0-coding', label: 'coding', color: '#111' },
      { id: '1-writing', label: 'writing', color: '#222' },
    ]);
  });

  test('legends the only slice of a single-slice pie', () => {
    expect(buildSeriesLegend(buildPieOptions(COLORS, slices.slice(0, 1)))).toEqual([
      { id: '0-coding', label: 'coding', color: '#111' },
    ]);
  });
});
