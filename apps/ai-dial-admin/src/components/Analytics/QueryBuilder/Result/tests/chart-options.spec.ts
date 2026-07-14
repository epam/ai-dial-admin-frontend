import { describe, expect, test } from 'vitest';

import {
  buildAreaChartOptions,
  buildBarChartOptions,
  buildLineChartOptions,
} from '@/src/components/Analytics/QueryBuilder/Result/chart-options';
import { CHART_COLOR } from '@/src/components/Common/MetricCard/constants';

const ROWS = [
  { deployment: 'gpt-4o', total: 120 },
  { deployment: 'claude', total: '80' },
  { deployment: 'gemini', total: null },
];

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

  test('area options add an alpha area fill from the accent token', () => {
    const options = buildAreaChartOptions(ROWS, 'deployment', 'total');
    expect(options.series[0].type).toBe('line');
    expect(options.series[0].areaStyle.color).toBe(`${CHART_COLOR.accent}2B`);
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
});
