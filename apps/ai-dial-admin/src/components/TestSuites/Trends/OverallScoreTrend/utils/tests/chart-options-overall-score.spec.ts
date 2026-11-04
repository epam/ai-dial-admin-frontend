import { describe, expect, test } from 'vitest';

import { buildOverallScoreChartOptions } from '@/src/components/TestSuites/Trends/OverallScoreTrend/utils/chart-options';
import { formatMetricTrendTooltipDate } from '@/src/components/TestSuites/Trends/utils/format';
import { TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { ThemePalette } from '@/src/models/theme';
import { fallbackDarkTheme } from '@/src/utils/themes/constant';

const palette = fallbackDarkTheme as ThemePalette;

const labels = {
  score: 'Score',
  threshold: 'Threshold',
};

const run = (overrides: Partial<TrendsRunPoint> & Pick<TrendsRunPoint, 'runId' | 'computedAtMs'>): TrendsRunPoint => ({
  runName: overrides.runId,
  overallScore: 0.6,
  durationMs: null,
  isFailed: false,
  ...overrides,
});

describe('buildOverallScoreChartOptions', () => {
  test('uses equal category slots keyed by run id with labels hidden in-canvas', () => {
    const first = new Date(2025, 11, 15, 10).getTime();
    const last = new Date(2026, 7, 17, 11).getTime();
    const runOrder = [
      run({ runId: 'a', runName: 'Run A', computedAtMs: first, overallScore: 0.4 }),
      run({ runId: 'b', runName: 'Run B', computedAtMs: last, overallScore: 0.8 }),
    ];
    const options = buildOverallScoreChartOptions(palette, runOrder, labels);

    expect(options.xAxis).toMatchObject({
      type: 'category',
      show: false,
      boundaryGap: false,
      data: ['a', 'b'],
    });
    expect(options.yAxis).toMatchObject({ axisLabel: { show: false } });
  });

  test('plots one series value per run without edge anchors', () => {
    const morning = new Date(2026, 7, 17, 9, 0).getTime();
    const evening = new Date(2026, 8, 11, 18, 30).getTime();
    const runOrder = [
      run({ runId: 'a', computedAtMs: morning, overallScore: 0.4 }),
      run({ runId: 'b', computedAtMs: evening, overallScore: 0.9 }),
    ];
    const options = buildOverallScoreChartOptions(palette, runOrder, labels);
    const seriesData = (options.series as { data: { value: number | null; runIndex?: number }[] }[])[0].data;

    expect(seriesData).toEqual([
      { value: 0.4, runIndex: 0, itemStyle: expect.any(Object) },
      { value: 0.9, runIndex: 1, itemStyle: expect.any(Object) },
    ]);
  });

  test('gives same-calendar-day runs distinct equal category slots', () => {
    const morning = new Date(2026, 7, 17, 9, 0).getTime();
    const evening = new Date(2026, 7, 17, 18, 30).getTime();
    const runOrder = [
      run({ runId: 'a', computedAtMs: morning, overallScore: 0.4 }),
      run({ runId: 'b', computedAtMs: evening, overallScore: 0.9 }),
    ];
    const options = buildOverallScoreChartOptions(palette, runOrder, labels);

    expect(options.xAxis).toMatchObject({ data: ['a', 'b'] });
    const seriesData = (options.series as { data: { runIndex?: number }[] }[])[0].data;
    expect(seriesData.map((row) => row.runIndex)).toEqual([0, 1]);
  });

  test('keeps a null slot when a run has no overall score', () => {
    const runOrder = [
      run({ runId: 'a', computedAtMs: 1, overallScore: 0.4 }),
      run({ runId: 'b', computedAtMs: 2, overallScore: null }),
      run({ runId: 'c', computedAtMs: 3, overallScore: 0.9 }),
    ];
    const options = buildOverallScoreChartOptions(palette, runOrder, labels);
    const seriesData = (options.series as { data: { value: number | null; runIndex?: number }[] }[])[0].data;

    expect(seriesData).toEqual([
      { value: 0.4, runIndex: 0, itemStyle: expect.any(Object) },
      { value: null, runIndex: 1 },
      { value: 0.9, runIndex: 2, itemStyle: expect.any(Object) },
    ]);
  });

  test('adds a full-width dashed threshold markLine for a single run with a snapshot threshold', () => {
    const runOrder = [run({ runId: 'a', computedAtMs: new Date(2026, 7, 17).getTime(), overallScoreThreshold: 0.6 })];
    const options = buildOverallScoreChartOptions(palette, runOrder, labels);
    const markLine = (options.series as { markLine: Record<string, unknown> }[])[0].markLine;

    expect(options.xAxis).toMatchObject({ type: 'category', data: ['a'] });
    expect(options.series).toHaveLength(1);
    expect(markLine).toMatchObject({
      silent: true,
      symbol: 'none',
      label: {
        show: true,
        position: 'insideStartTop',
        formatter: 'Threshold (0.6)',
        color: palette['text-primary'],
      },
      lineStyle: {
        color: palette['stroke-accent-secondary'],
        width: 1,
        type: 'dashed',
      },
      data: [{ yAxis: 0.6 }],
    });
  });

  test('omits markLine when no run has a snapshot threshold', () => {
    const runOrder = [
      run({ runId: 'a', computedAtMs: new Date(2026, 7, 17).getTime(), overallScoreThreshold: null }),
      run({ runId: 'b', computedAtMs: new Date(2026, 7, 18).getTime() }),
    ];
    const options = buildOverallScoreChartOptions(palette, runOrder, labels);
    const series = options.series as { markLine?: unknown }[];

    expect(series).toHaveLength(1);
    expect(series[0].markLine).toBeUndefined();
  });

  test('places the threshold label below the line when threshold is the axis max', () => {
    const runOrder = [run({ runId: 'a', computedAtMs: new Date(2026, 7, 17).getTime(), overallScoreThreshold: 1 })];
    const options = buildOverallScoreChartOptions(palette, runOrder, labels);
    const markLine = (options.series as { markLine: { label: { position: string } } }[])[0].markLine;

    expect(markLine.label.position).toBe('insideStartBottom');
  });

  test('includes markLine when the run snapshot threshold is 0', () => {
    const runOrder = [run({ runId: 'a', computedAtMs: new Date(2026, 7, 17).getTime(), overallScoreThreshold: 0 })];
    const options = buildOverallScoreChartOptions(palette, runOrder, labels);
    const markLine = (options.series as { markLine: { data: { yAxis: number }[] } }[])[0].markLine;

    expect(markLine.data[0].yAxis).toBe(0);
  });

  test('draws per-run threshold segments on a hidden value x-axis', () => {
    const runOrder = [
      run({ runId: 'a', computedAtMs: 1, overallScoreThreshold: 0.6 }),
      run({ runId: 'b', computedAtMs: 2, overallScoreThreshold: 0.6 }),
      run({ runId: 'c', computedAtMs: 3, overallScoreThreshold: 0.8 }),
      run({ runId: 'd', computedAtMs: 4, overallScoreThreshold: null }),
      run({ runId: 'e', computedAtMs: 5, overallScoreThreshold: 0.6 }),
    ];
    const options = buildOverallScoreChartOptions(palette, runOrder, labels);
    const xAxes = options.xAxis as { type: string; max?: number }[];
    const series = options.series as {
      markLine?: { data: unknown[]; lineStyle: { color: string } };
      xAxisIndex?: number;
      silent?: boolean;
    }[];

    expect(xAxes).toHaveLength(2);
    expect(xAxes[0]).toMatchObject({ type: 'category', data: ['a', 'b', 'c', 'd', 'e'] });
    expect(xAxes[1]).toMatchObject({ type: 'value', min: 0, max: 4, show: false });

    expect(series).toHaveLength(2);
    expect(series[0].markLine).toBeUndefined();
    expect(series[1]).toMatchObject({
      xAxisIndex: 1,
      silent: true,
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: {
          color: palette['stroke-accent-secondary'],
          width: 1,
          type: 'dashed',
        },
      },
    });
    expect(series[1].markLine?.data).toEqual([
      [
        {
          coord: [0, 0.6],
          label: {
            show: true,
            position: 'insideStartTop',
            formatter: 'Threshold (0.6)',
            color: palette['text-primary'],
            fontSize: 10,
          },
        },
        { coord: [1.5, 0.6] },
      ],
      [
        {
          coord: [1.5, 0.6],
          label: { show: false },
          lineStyle: {
            color: palette['stroke-accent-secondary'],
            width: 1,
            type: [2, 8],
          },
        },
        { coord: [1.5, 0.8] },
      ],
      [
        {
          coord: [1.5, 0.8],
          label: {
            show: true,
            position: 'insideStartTop',
            formatter: 'Threshold (0.8)',
            color: palette['text-primary'],
            fontSize: 10,
          },
        },
        { coord: [2.5, 0.8] },
      ],
      [
        {
          coord: [3.5, 0.6],
          label: {
            show: false,
            position: 'insideStartTop',
            formatter: 'Threshold (0.6)',
            color: palette['text-primary'],
            fontSize: 10,
          },
        },
        { coord: [4, 0.6] },
      ],
    ]);
  });

  test('labels each threshold value once when it returns after another value', () => {
    const runOrder = [0, 1, 0].map((overallScoreThreshold, index) =>
      run({ runId: `run-${index}`, computedAtMs: index, overallScoreThreshold }),
    );
    const options = buildOverallScoreChartOptions(palette, runOrder, labels);
    expect(options.series).toMatchObject([
      {},
      {
        markLine: {
          data: [
            [{ label: { show: true, formatter: 'Threshold (0)' } }, {}],
            [{ label: { show: false } }, {}],
            [{ label: { show: true, formatter: 'Threshold (1)' } }, {}],
            [{ label: { show: false } }, {}],
            [{ label: { show: false, formatter: 'Threshold (0)' } }, {}],
          ],
        },
      },
    ]);

    const nextOptions = buildOverallScoreChartOptions(palette, runOrder, labels);
    expect(nextOptions.series).toEqual(options.series);
  });

  test('tooltip shows run link, month-year time, and score row', () => {
    const runAt = new Date(2026, 1, 19, 10, 12).getTime();
    const runOrder = [run({ runId: 'r23', runName: 'Run #23', computedAtMs: runAt, overallScore: 0.65 })];
    const options = buildOverallScoreChartOptions(palette, runOrder, labels);
    const formatter = (
      options.tooltip as {
        formatter: (params: { data?: { runIndex?: number } }) => string;
      }
    ).formatter;

    const html = formatter({ data: { runIndex: 0 } });

    expect(html).toContain('Run #23');
    expect(html).toContain(formatMetricTrendTooltipDate(runAt));
    expect(html).toContain('Score');
    expect(html).toContain('0.65');
    expect(html).toContain('<svg');
    expect(html).not.toContain('Date:');
    expect(html).not.toContain('Run:');
  });
});
