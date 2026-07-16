import { describe, expect, test } from 'vitest';

import {
  bucketTopSlices,
  buildBarChartOptions,
  buildChartOptions,
  buildLineChartOptions,
  buildPieChartOptions,
  buildScatterChartOptions,
  getNumericColumns,
} from '@/src/components/Analytics/QueryBuilder/Result/chart-options';
import { CHART_COLOR } from '@/src/components/Common/MetricCard/constants';
import { CHART_SERIES_COLOR_CYCLE } from '@/src/constants/analytics/query-builder-palette';
import { ChartType } from '@/src/models/analytics/query-builder';

const ROWS = [
  { deployment: 'gpt-4o', total: 120 },
  { deployment: 'claude', total: '80' },
  { deployment: 'gemini', total: null },
];

const CONTEXT = { dimensionColumns: ['deployment'], otherLabel: 'Other', columnLabels: {} };

describe('QueryBuilder :: chart-options', () => {
  test('bar options map x categories and numeric y values', () => {
    const options = buildBarChartOptions(ROWS, 'deployment', 'total');
    expect(options.xAxis.data).toEqual(['gpt-4o', 'claude', 'gemini']);
    expect(options.series).toEqual([
      { type: 'bar', data: [120, 80, null], barMaxWidth: 48, itemStyle: { color: CHART_COLOR.accent } },
    ]);
    expect(options.yAxis.name).toBe('total');
    expect(options.color).toBe(CHART_COLOR.accent);
  });

  test('line options build a smooth line series without area fill', () => {
    const options = buildLineChartOptions(ROWS, 'deployment', 'total');
    expect(options.series[0].type).toBe('line');
    expect(options.series[0].smooth).toBe(true);
    expect(options.series[0].areaStyle).toBeUndefined();
  });

  test('object x values are stringified and non-numeric y values become null', () => {
    const rows = [{ key: { a: 1 }, total: 'not-a-number' }];
    const options = buildBarChartOptions(rows, 'key', 'total');
    expect(options.xAxis.data).toEqual(['{"a":1}']);
    expect(options.series[0].data).toEqual([null]);
  });

  test('empty rows build empty axes and series data', () => {
    const options = buildBarChartOptions([], 'deployment', 'total');
    expect(options.xAxis.data).toEqual([]);
    expect(options.series[0].data).toEqual([]);
  });

  test('date-like x values are re-ordered chronologically regardless of row order', () => {
    const rows = [
      { bucket: '2026-07-13T08:00:00Z', cnt: 3 },
      { bucket: '2026-07-12T00:00:00Z', cnt: 1 },
      { bucket: '2026-07-12T10:00:00Z', cnt: 2 },
    ];
    const options = buildBarChartOptions(rows, 'bucket', 'cnt');
    expect(options.xAxis.data).toEqual(['2026-07-12T00:00:00Z', '2026-07-12T10:00:00Z', '2026-07-13T08:00:00Z']);
    expect(options.series[0].data).toEqual([1, 2, 3]);
  });

  test('numeric x values sort numerically, not lexicographically', () => {
    const rows = [
      { code: '200', cnt: 5 },
      { code: '41', cnt: 7 },
      { code: 100, cnt: 6 },
    ];
    const options = buildBarChartOptions(rows, 'code', 'cnt');
    expect(options.xAxis.data).toEqual(['41', '100', '200']);
    expect(options.series[0].data).toEqual([7, 6, 5]);
  });

  test('plain-text x values keep the query row order', () => {
    const options = buildBarChartOptions(ROWS, 'deployment', 'total');
    expect(options.xAxis.data).toEqual(['gpt-4o', 'claude', 'gemini']);
  });

  test('x labels are truncated to a fixed width, keeping the axis readable for long values', () => {
    const options = buildBarChartOptions(ROWS, 'deployment', 'total');
    expect(options.xAxis.axisLabel).toMatchObject({ width: 120, overflow: 'truncate' });
  });

  describe('getNumericColumns', () => {
    const rows = [
      { model: 'gpt-4o', count: 3, rate: '0.5', day: '2026-07-01', note: 'ok' },
      { model: 'claude', count: 7, rate: '1.2', day: '2026-07-02', note: null },
    ];

    test('keeps numbers, numeric strings, and date-like strings; drops text and null-holding columns', () => {
      expect(getNumericColumns(rows, ['model', 'count', 'rate', 'day', 'note'])).toEqual(['count', 'rate', 'day']);
    });

    test('empty rows yield no numeric columns', () => {
      expect(getNumericColumns([], ['count'])).toEqual([]);
    });
  });

  describe('bucketTopSlices', () => {
    test('few categories sort by value descending with no Other slice', () => {
      const slices = bucketTopSlices(ROWS, 'deployment', 'total', 'Other');
      expect(slices).toEqual([
        { name: 'gpt-4o', value: 120 },
        { name: 'claude', value: 80 },
        { name: 'gemini', value: 0 },
      ]);
    });

    test('categories beyond the cap merge into one Other slice with the summed value', () => {
      const rows = Array.from({ length: 12 }, (_, i) => ({ model: `m${i}`, cnt: 12 - i }));
      const slices = bucketTopSlices(rows, 'model', 'cnt', 'Other', 10);
      expect(slices).toHaveLength(11);
      expect(slices[0]).toEqual({ name: 'm0', value: 12 });
      expect(slices[10]).toEqual({ name: 'Other', value: 3 });
    });
  });

  describe('pie', () => {
    test('pie options bucket slices and cycle the shared series palette', () => {
      const options = buildPieChartOptions(ROWS, 'deployment', 'total', 'Other');
      expect(options.series[0].type).toBe('pie');
      expect(options.series[0].data[0]).toEqual({ name: 'gpt-4o', value: 120 });
      expect(options.color).toBe(CHART_SERIES_COLOR_CYCLE);
      expect(options.tooltip.trigger).toBe('item');
    });
  });

  describe('scatter', () => {
    const rows = [
      { model: 'gpt-4o', count: 3, tokens: 900 },
      { model: 'claude', count: 7, tokens: 400 },
    ];

    test('plots one point per row in query row order, named by the dimension values', () => {
      const options = buildScatterChartOptions(rows, 'count', 'tokens', ['model']);
      expect(options.series[0].type).toBe('scatter');
      expect(options.series[0].data).toEqual([
        { name: 'gpt-4o', value: [3, 900] },
        { name: 'claude', value: [7, 400] },
      ]);
      expect(options.xAxis.type).toBe('value');
      expect(options.yAxis.type).toBe('value');
      expect(options.tooltip.trigger).toBe('item');
    });

    test('rows with a missing coordinate are dropped', () => {
      const withGap = [...rows, { model: 'gemini', count: null, tokens: 100 }];
      const options = buildScatterChartOptions(withGap, 'count', 'tokens', ['model']);
      expect(options.series[0].data).toHaveLength(2);
    });

    test('date-like axis values switch that axis to time and keep raw values', () => {
      const dated = [
        { day: '2026-07-02', cnt: 2 },
        { day: '2026-07-01', cnt: 1 },
      ];
      const options = buildScatterChartOptions(dated, 'day', 'cnt', []);
      expect(options.xAxis.type).toBe('time');
      expect(options.series[0].data.map((d: { value: unknown[] }) => d.value[0])).toEqual(['2026-07-02', '2026-07-01']);
    });
  });

  describe('buildChartOptions dispatch', () => {
    test('routes each type to its series shape', () => {
      expect(buildChartOptions(ChartType.Bar, ROWS, 'deployment', 'total', CONTEXT).series[0].type).toBe('bar');
      expect(buildChartOptions(ChartType.Line, ROWS, 'deployment', 'total', CONTEXT).series[0].type).toBe('line');
      expect(buildChartOptions(ChartType.Pie, ROWS, 'deployment', 'total', CONTEXT).series[0].type).toBe('pie');
      expect(buildChartOptions(ChartType.Scatter, ROWS, 'total', 'total', CONTEXT).series[0].type).toBe('scatter');
    });

    test('axis titles and scatter tooltips use display labels when provided', () => {
      const labeled = { ...CONTEXT, columnLabels: { total_tokens: 'Total tokens', total: 'Total' } };
      const rows = [
        { total_tokens: 10, total: 1 },
        { total_tokens: 20, total: 2 },
      ];
      const bar = buildChartOptions(ChartType.Bar, rows, 'deployment', 'total', labeled);
      expect(bar.yAxis.name).toBe('Total');
      const scatter = buildChartOptions(ChartType.Scatter, rows, 'total_tokens', 'total', labeled);
      expect(scatter.xAxis.name).toBe('Total tokens');
      expect(scatter.yAxis.name).toBe('Total');
      expect(scatter.tooltip.formatter({ name: '', value: [10, 1] })).toBe('Total tokens: 10<br/>Total: 1');
    });
  });
});
