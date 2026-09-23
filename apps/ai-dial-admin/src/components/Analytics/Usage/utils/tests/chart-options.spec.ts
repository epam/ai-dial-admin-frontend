import { describe, expect, test } from 'vitest';

import {
  buildBarOptions,
  buildDonutOptions,
  buildLatencyOptions,
  buildStackedAreaOptions,
  formatChartNumber,
} from '@/src/components/Analytics/Usage/utils/chart-options';

interface AxisParam {
  axisValue: string;
  dataIndex: number;
  value?: number | null;
  data: number | null | { value: number | null };
  marker?: string;
  seriesName?: string;
}

type AxisFormatter = (params: AxisParam[]) => string;

const formatterOf = (options: { tooltip?: unknown }): AxisFormatter =>
  (options.tooltip as { formatter: AxisFormatter }).formatter;

const param = (data: number | null, overrides: Partial<AxisParam> = {}): AxisParam => ({
  axisValue: 'Sep 22',
  dataIndex: 0,
  value: data,
  data,
  ...overrides,
});

/** What ECharts hands a bar series: the figure in `value`, the toned item in `data`. */
const barParam = (figure: number, overrides: Partial<AxisParam> = {}): AxisParam => ({
  axisValue: 'Sep 22',
  dataIndex: 0,
  value: figure,
  data: { value: figure },
  ...overrides,
});

describe('formatChartNumber', () => {
  test('stops at two decimals by default', () => {
    expect(formatChartNumber(9149.517302573204)).toBe('9,149.52');
  });

  test('takes the precision a caller asks for', () => {
    expect(formatChartNumber(20.50087114, 1)).toBe('20.5');
  });
});

describe('axis tooltips', () => {
  test('rounds a cost to one decimal instead of printing the raw float', () => {
    expect(formatterOf(buildBarOptions(['Sep'], [20.50087114]))([param(20.50087114)])).toContain('20.5');
  });

  test('rounds a latency to one decimal', () => {
    const options = buildLatencyOptions(['12:00'], [9149.517302573204], [null]);

    expect(formatterOf(options)([param(9149.517302573204, { seriesName: 'p50' })])).toContain('9,149.5');
  });

  test('states a bucket with no figure as a dash rather than a zero', () => {
    expect(formatterOf(buildLatencyOptions(['12:00'], [null], [null]))([param(null)])).toContain('—');
  });

  test('tones every bar the same, so none reads as the answer', () => {
    const series = (
      buildBarOptions(['a', 'b'], [1, 2]).series as [{ itemStyle?: { color?: string }; data?: unknown }]
    )[0];

    expect(series.itemStyle?.color).toBeTruthy();
    expect(series.data).toEqual([1, 2]);
  });

  test('states a bar figure, which the series holds as an object rather than a number', () => {
    const options = buildBarOptions(['Sep 22'], [20.50087114]);

    expect(formatterOf(options)([barParam(20.50087114)])).toContain('20.5');
  });

  test('heads the tooltip with the period the bucket covers, where the caller states one', () => {
    const options = buildBarOptions(['Sep 22'], [1], ['Sep 22, 02:00 – 04:00']);

    expect(formatterOf(options)([param(1)])).toContain('Sep 22, 02:00 – 04:00');
  });

  test('falls back to the axis label when it states none', () => {
    expect(formatterOf(buildBarOptions(['Sep 22'], [1]))([param(1)])).toContain('Sep 22');
  });
});

describe('series colours', () => {
  const colorsOf = (options: { series?: unknown }) => (options.series as { color?: string }[]).map((s) => s.color);

  test('states each latency series own colour, which its tooltip marker reads', () => {
    const [p50, p95] = colorsOf(buildLatencyOptions(['12:00'], [1], [2]));

    expect(p50).toBeTruthy();
    expect(p95).toBeTruthy();
    expect(p50).not.toBe(p95);
  });

  test('states a split series colour on the series, not only on its line', () => {
    const options = buildStackedAreaOptions(['12:00'], [{ id: 'a', label: 'a', color: '#7DA4FF', values: [1] }]);

    expect(colorsOf(options)).toEqual(['#7DA4FF']);
  });
});

describe('latency gaps', () => {
  test('draws no line across a bucket with no percentile to state', () => {
    const series = buildLatencyOptions(['12:00', '13:00'], [1, null], [2, null]).series as {
      connectNulls?: boolean;
      sampling?: string;
    }[];

    expect(series.every((entry) => entry.connectNulls === false)).toBe(true);
    // `lttb` drops points to fit the pixels, gaps included, so a sampled line bridges them anyway.
    expect(series.every((entry) => entry.sampling === undefined)).toBe(true);
  });
});

describe('buildDonutOptions', () => {
  const seriesOf = (options: { series?: unknown }) =>
    (
      options.series as [
        { emphasis?: { focus?: string; scale?: boolean }; blur?: { itemStyle?: { opacity?: number } } },
      ]
    )[0];

  test('keeps the hovered slice and fades the others', () => {
    const series = seriesOf(buildDonutOptions([{ name: 'gpt-4o', value: 10, itemStyle: { color: '#7DA4FF' } }]));

    expect(series.emphasis?.focus).toBe('self');
    expect(series.blur?.itemStyle?.opacity).toBeLessThan(1);
  });

  test('does not grow the hovered slice, which would move the ring under the cursor', () => {
    expect(
      seriesOf(buildDonutOptions([{ name: 'gpt-4o', value: 10, itemStyle: { color: '#7DA4FF' } }])).emphasis?.scale,
    ).toBe(false);
  });
});
