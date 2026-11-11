import { describe, expect, test } from 'vitest';

import {
  bucketTopSlices,
  buildBarChartOptions,
  buildChartOptions,
  buildLineChartOptions,
  buildPieChartOptions,
  buildScatterChartOptions,
  buildSeriesLegend,
  getNumericColumns,
  getStrictNumericColumns,
} from '@/src/components/Analytics/QueryBuilder/Result/chart-options';
import { getChartColors } from '@/src/components/Common/MetricCard/utils';
import { CHART_SERIES_COLOR_CYCLE } from '@/src/constants/analytics/query-builder-palette';
import { ChartType } from '@/src/models/analytics/query-builder';
import { fallbackDarkTheme } from '@/src/utils/themes/constant';

const ROWS = [
  { deployment: 'gpt-4o', total: 120 },
  { deployment: 'claude', total: '80' },
  { deployment: 'gemini', total: null },
];

const COLORS = getChartColors(fallbackDarkTheme);

const CONTEXT = {
  colors: COLORS,
  dimensionColumns: ['deployment'],
  otherLabel: 'Other',
  emptyLabel: '(no value)',
  columnLabels: {},
};

describe('QueryBuilder :: chart-options', () => {
  test('bar options map x categories and numeric y values', () => {
    const options = buildBarChartOptions(COLORS, ROWS, 'deployment', ['total']);
    expect(options.xAxis.data).toEqual(['gpt-4o', 'claude', 'gemini']);
    expect(options.series).toEqual([
      { type: 'bar', name: 'total', data: [120, 80, null], barMaxWidth: 48, itemStyle: { color: COLORS.accent } },
    ]);
    expect(options.yAxis.name).toBe('total');
    expect(options.color).toBe(COLORS.accent);
  });

  test('line options build a smooth line series without area fill', () => {
    const options = buildLineChartOptions(COLORS, ROWS, 'deployment', ['total']);
    expect(options.series[0].type).toBe('line');
    expect(options.series[0].smooth).toBe(true);
    expect(options.series[0].areaStyle).toBeUndefined();
  });

  test('object x values are stringified and non-numeric y values become null', () => {
    const rows = [{ key: { a: 1 }, total: 'not-a-number' }];
    const options = buildBarChartOptions(COLORS, rows, 'key', ['total']);
    expect(options.xAxis.data).toEqual(['{"a":1}']);
    expect(options.series[0].data).toEqual([null]);
  });

  test('empty rows build empty axes and series data', () => {
    const options = buildBarChartOptions(COLORS, [], 'deployment', ['total']);
    expect(options.xAxis.data).toEqual([]);
    expect(options.series[0].data).toEqual([]);
  });

  test('date-like x values are re-ordered chronologically regardless of row order', () => {
    const rows = [
      { bucket: '2026-07-13T08:00:00Z', cnt: 3 },
      { bucket: '2026-07-12T00:00:00Z', cnt: 1 },
      { bucket: '2026-07-12T10:00:00Z', cnt: 2 },
    ];
    const options = buildBarChartOptions(COLORS, rows, 'bucket', ['cnt']);
    expect(options.xAxis.data).toEqual(['2026-07-12T00:00:00Z', '2026-07-12T10:00:00Z', '2026-07-13T08:00:00Z']);
    expect(options.series[0].data).toEqual([1, 2, 3]);
  });

  test('numeric x values sort numerically, not lexicographically', () => {
    const rows = [
      { code: '200', cnt: 5 },
      { code: '41', cnt: 7 },
      { code: 100, cnt: 6 },
    ];
    const options = buildBarChartOptions(COLORS, rows, 'code', ['cnt']);
    expect(options.xAxis.data).toEqual(['41', '100', '200']);
    expect(options.series[0].data).toEqual([7, 6, 5]);
  });

  test('plain-text x values keep the query row order', () => {
    const options = buildBarChartOptions(COLORS, ROWS, 'deployment', ['total']);
    expect(options.xAxis.data).toEqual(['gpt-4o', 'claude', 'gemini']);
  });

  test('x labels are truncated to a fixed width, keeping the axis readable for long values', () => {
    const options = buildBarChartOptions(COLORS, ROWS, 'deployment', ['total']);
    expect(options.xAxis.axisLabel).toMatchObject({ width: 120, overflow: 'truncate' });
  });

  describe('multi-series', () => {
    const SERIES_ROWS = [
      { week: '2026-10-05', fresh: 4, returning: 10 },
      { week: '2026-10-12', fresh: 6, returning: 12 },
    ];

    test('draws one line per Y column in pick order, coloured from the series palette', () => {
      const options = buildLineChartOptions(COLORS, SERIES_ROWS, 'week', ['returning', 'fresh']);
      expect(options.series.map((s: { name: string; data: number[] }) => [s.name, s.data])).toEqual([
        ['returning', [10, 12]],
        ['fresh', [4, 6]],
      ]);
      expect(options.series.map((s: { lineStyle: { color: string } }) => s.lineStyle.color)).toEqual(
        CHART_SERIES_COLOR_CYCLE.slice(0, 2),
      );
    });

    test('drops the Y-axis title and leaves the legend to the page when there are several series', () => {
      const options = buildChartOptions(ChartType.Line, SERIES_ROWS, 'week', ['fresh', 'returning'], {
        ...CONTEXT,
        columnLabels: { fresh: 'New', returning: 'Returning' },
      });
      expect(options.legend).toBeUndefined();
      expect(options.yAxis.name).toBeUndefined();
      expect(options.series.map((s: { name: string }) => s.name)).toEqual(['New', 'Returning']);
    });

    test('keeps a single series without a legend and with the Y-axis title', () => {
      const options = buildChartOptions(ChartType.Line, SERIES_ROWS, 'week', ['fresh'], CONTEXT);
      expect(options.legend).toBeUndefined();
      expect(options.yAxis.name).toBe('fresh');
    });

    test('fades the other series while one series of several is focused', () => {
      const line = buildLineChartOptions(COLORS, SERIES_ROWS, 'week', ['fresh', 'returning']);
      const bar = buildBarChartOptions(COLORS, SERIES_ROWS, 'week', ['fresh', 'returning']);
      for (const s of [...line.series, ...bar.series]) expect(s.emphasis).toEqual({ focus: 'series' });
      expect(buildLineChartOptions(COLORS, SERIES_ROWS, 'week', ['fresh']).series[0].emphasis).toBeUndefined();
    });

    test('groups bars of several series side by side instead of stacking them', () => {
      const options = buildBarChartOptions(COLORS, SERIES_ROWS, 'week', ['fresh', 'returning']);
      expect(options.series).toHaveLength(2);
      expect(options.series.every((s: { type: string; stack?: string }) => s.type === 'bar' && !s.stack)).toBe(true);
    });

    test('repeats the palette past its last colour', () => {
      const fields = CHART_SERIES_COLOR_CYCLE.map((_, index) => `m${index}`).concat('extra');
      const options = buildBarChartOptions(COLORS, [], 'week', fields);
      expect(options.series.at(-1).itemStyle.color).toBe(CHART_SERIES_COLOR_CYCLE[0]);
    });

    test('lists every series of a multi-series chart as a legend entry with its colour', () => {
      const options = buildChartOptions(ChartType.Bar, SERIES_ROWS, 'week', ['fresh', 'returning'], {
        ...CONTEXT,
        columnLabels: { fresh: 'New' },
      });
      expect(buildSeriesLegend(options)).toEqual([
        { id: '0-New', label: 'New', color: CHART_SERIES_COLOR_CYCLE[0], seriesIndex: 0 },
        { id: '1-returning', label: 'returning', color: CHART_SERIES_COLOR_CYCLE[1], seriesIndex: 1 },
      ]);
    });

    test('lists no legend entries for a single series, a pie, or no chart', () => {
      expect(buildSeriesLegend(buildChartOptions(ChartType.Line, SERIES_ROWS, 'week', ['fresh'], CONTEXT))).toEqual([]);
      expect(
        buildSeriesLegend(buildChartOptions(ChartType.Pie, SERIES_ROWS, 'week', ['fresh', 'returning'], CONTEXT)),
      ).toEqual([]);
      expect(buildSeriesLegend(null)).toEqual([]);
    });

    test('pie and scatter draw only from the first Y column', () => {
      const pie = buildChartOptions(ChartType.Pie, SERIES_ROWS, 'week', ['fresh', 'returning'], CONTEXT);
      expect(pie.series[0].data.map((slice: { value: number }) => slice.value)).toEqual([6, 4]);
      const scatter = buildChartOptions(ChartType.Scatter, SERIES_ROWS, 'returning', ['fresh', 'returning'], CONTEXT);
      expect(scatter.series).toHaveLength(1);
      expect(scatter.yAxis.name).toBe('fresh');
    });
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

  describe('getStrictNumericColumns', () => {
    const rows = [
      { model: 'gpt-4o', count: 3, rate: '0.5', day: '2026-07-01', note: 'ok' },
      { model: 'claude', count: 7, rate: '1.2', day: '2026-07-02', note: null },
    ];

    test('drops the date-like column getNumericColumns keeps', () => {
      expect(getStrictNumericColumns(rows, ['model', 'count', 'rate', 'day', 'note'])).toEqual(['count', 'rate']);
      expect(getNumericColumns(rows, ['day'])).toEqual(['day']);
    });

    test('empty rows yield no numeric columns', () => {
      expect(getStrictNumericColumns([], ['count'])).toEqual([]);
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
      const options = buildPieChartOptions(COLORS, ROWS, 'deployment', 'total', 'Other');
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
      const options = buildScatterChartOptions(COLORS, rows, 'count', 'tokens', ['model']);
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
      const options = buildScatterChartOptions(COLORS, withGap, 'count', 'tokens', ['model']);
      expect(options.series[0].data).toHaveLength(2);
    });

    test('date-like axis values switch that axis to time and keep raw values', () => {
      const dated = [
        { day: '2026-07-02', cnt: 2 },
        { day: '2026-07-01', cnt: 1 },
      ];
      const options = buildScatterChartOptions(COLORS, dated, 'day', 'cnt', []);
      expect(options.xAxis.type).toBe('time');
      expect(options.series[0].data.map((d: { value: unknown[] }) => d.value[0])).toEqual(['2026-07-02', '2026-07-01']);
    });
  });

  describe('buildChartOptions dispatch', () => {
    test('names a category with no value on the axis and in a pie', () => {
      const rows = [
        { deployment: '', total: 2 },
        { deployment: 'gpt', total: 1 },
      ];
      const bar = buildChartOptions(ChartType.Bar, rows, 'deployment', ['total'], CONTEXT);
      expect((bar.xAxis as { data: string[] }).data).toContain('(no value)');
      const pie = buildChartOptions(ChartType.Pie, rows, 'deployment', ['total'], CONTEXT);
      expect((pie.series as Array<{ data: Array<{ name: string }> }>)[0].data.map((slice) => slice.name)).toContain(
        '(no value)',
      );
    });

    test('routes each type to its series shape', () => {
      expect(buildChartOptions(ChartType.Bar, ROWS, 'deployment', ['total'], CONTEXT).series[0].type).toBe('bar');
      expect(buildChartOptions(ChartType.Line, ROWS, 'deployment', ['total'], CONTEXT).series[0].type).toBe('line');
      expect(buildChartOptions(ChartType.Pie, ROWS, 'deployment', ['total'], CONTEXT).series[0].type).toBe('pie');
      expect(buildChartOptions(ChartType.Scatter, ROWS, 'total', ['total'], CONTEXT).series[0].type).toBe('scatter');
    });

    test('axis titles and scatter tooltips use display labels when provided', () => {
      const labeled = { ...CONTEXT, columnLabels: { total_tokens: 'Total tokens', total: 'Total' } };
      const rows = [
        { total_tokens: 10, total: 1 },
        { total_tokens: 20, total: 2 },
      ];
      const bar = buildChartOptions(ChartType.Bar, rows, 'deployment', ['total'], labeled);
      expect(bar.yAxis.name).toBe('Total');
      const scatter = buildChartOptions(ChartType.Scatter, rows, 'total_tokens', ['total'], labeled);
      expect(scatter.xAxis.name).toBe('Total tokens');
      expect(scatter.yAxis.name).toBe('Total');
      expect(scatter.tooltip.formatter({ name: '', value: [10, 1] })).toBe('Total tokens: 10<br/>Total: 1');
    });
  });
});
