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

  test('adds a dashed threshold markLine with label when threshold is set', () => {
    const runOrder = [run({ runId: 'a', computedAtMs: new Date(2026, 7, 17).getTime() })];
    const options = buildOverallScoreChartOptions(palette, runOrder, labels, 0.6);
    const markLine = (options.series as { markLine: Record<string, unknown> }[])[0].markLine;

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

  test('omits markLine when threshold is unset', () => {
    const runOrder = [run({ runId: 'a', computedAtMs: new Date(2026, 7, 17).getTime() })];
    const options = buildOverallScoreChartOptions(palette, runOrder, labels, null);
    const series = (options.series as { markLine?: unknown }[])[0];

    expect(series.markLine).toBeUndefined();
  });

  test('places the threshold label below the line when threshold is the axis max', () => {
    const runOrder = [run({ runId: 'a', computedAtMs: new Date(2026, 7, 17).getTime() })];
    const options = buildOverallScoreChartOptions(palette, runOrder, labels, 1);
    const markLine = (options.series as { markLine: { label: { position: string } } }[])[0].markLine;

    expect(markLine.label.position).toBe('insideStartBottom');
  });

  test('includes markLine when threshold is 0', () => {
    const runOrder = [run({ runId: 'a', computedAtMs: new Date(2026, 7, 17).getTime() })];
    const options = buildOverallScoreChartOptions(palette, runOrder, labels, 0);
    const markLine = (options.series as { markLine: { data: { yAxis: number }[] } }[])[0].markLine;

    expect(markLine.data[0].yAxis).toBe(0);
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
