import { describe, expect, test } from 'vitest';

import { TREND_METRIC_SYMBOL_SIZE } from '@/src/components/TestSuites/Trends/constants';
import {
  buildMetricTrendChartOptions,
  resolveNearestMetricTrendCategoryIndex,
} from '@/src/components/TestSuites/Trends/MetricTrends/utils/chart-options';
import { formatTrendScoreYTick as formatMetricTrendYTick } from '@/src/components/TestSuites/Trends/utils/score-axis';
import { formatMetricTrendTooltipDate } from '@/src/components/TestSuites/Trends/utils/format';
import { MetricTrendSeries, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';
import { fallbackDarkTheme } from '@/src/utils/themes/constant';

describe('buildMetricTrendChartOptions', () => {
  const runOrder: TrendsRunPoint[] = [
    {
      runId: 'r1',
      runName: 'Run1',
      computedAtMs: new Date(2026, 7, 10).getTime(),
      overallScore: 0.4,
      durationMs: 100,
      isFailed: false,
    },
    {
      runId: 'r2',
      runName: 'Run2',
      computedAtMs: new Date(2026, 8, 12).getTime(),
      overallScore: 0.5,
      durationMs: 120,
      isFailed: true,
    },
  ];

  const series: MetricTrendSeries[] = [
    { name: 'faithfulness', color: '#30E070', values: [0.5, 0.7] },
    { name: 'precision', color: '#D4BE3A', values: [0.4, 0.6] },
  ];

  test('fixes the score domain to 0-1 with 0.25 intervals', () => {
    const options = buildMetricTrendChartOptions(fallbackDarkTheme, runOrder, series, new Set());

    expect(options.yAxis).toMatchObject({ type: 'value', min: 0, max: 1, interval: 0.25 });
  });

  test('hides in-canvas Y labels so the scale can sit outside the bordered plot', () => {
    const options = buildMetricTrendChartOptions(fallbackDarkTheme, runOrder, series, new Set());

    expect(options.yAxis).toMatchObject({ axisLabel: { show: false } });
  });

  test('formats external Y ticks like Figma (0 / 0.25 / 0.50 / 0.75 / 1)', () => {
    expect(formatMetricTrendYTick(1)).toBe('1');
    expect(formatMetricTrendYTick(0.75)).toBe('0.75');
    expect(formatMetricTrendYTick(0.5)).toBe('0.50');
    expect(formatMetricTrendYTick(0.25)).toBe('0.25');
    expect(formatMetricTrendYTick(0)).toBe('0');
  });

  test('uses equal category slots with labels hidden in-canvas and always-visible symbols', () => {
    const options = buildMetricTrendChartOptions(fallbackDarkTheme, runOrder, series, new Set());

    expect(options.xAxis).toMatchObject({
      type: 'category',
      show: false,
      boundaryGap: false,
      data: ['r1', 'r2'],
    });
    expect((options.series as { showSymbol: boolean; symbolSize: number }[])[0]).toMatchObject({
      showSymbol: true,
      symbolSize: TREND_METRIC_SYMBOL_SIZE,
    });
  });

  test('maps one series value per run without edge anchors', () => {
    const options = buildMetricTrendChartOptions(
      fallbackDarkTheme,
      runOrder,
      series.map((item) => ({ ...item, values: [0.5, 0.7] })),
      new Set(),
    );

    expect((options.series as { data: { value: number | null; runIndex: number }[] }[])[0].data).toEqual([
      { value: 0.5, runIndex: 0 },
      { value: 0.7, runIndex: 1 },
    ]);
  });

  test('centers a single-run category without edge anchors', () => {
    const oneRun: TrendsRunPoint[] = [
      {
        runId: 'r1',
        runName: 'Run1',
        computedAtMs: new Date(2026, 9, 19, 12, 0).getTime(),
        overallScore: 0.55,
        durationMs: 100,
        isFailed: false,
      },
    ];
    const options = buildMetricTrendChartOptions(
      fallbackDarkTheme,
      oneRun,
      [{ name: 'faithfulness', color: '#30E070', values: [0.55] }],
      new Set(),
    );

    expect(options.xAxis).toMatchObject({
      type: 'category',
      boundaryGap: false,
      data: ['r1'],
    });
    expect((options.series as { data: { value: number | null; runIndex: number }[] }[])[0].data).toEqual([
      { value: 0.55, runIndex: 0 },
    ]);
  });

  test('uses click-to-stick enterable tooltips so run links stay clickable', () => {
    const options = buildMetricTrendChartOptions(fallbackDarkTheme, runOrder, series, new Set());

    expect(options.tooltip).toMatchObject({
      trigger: 'axis',
      triggerOn: 'click',
      enterable: true,
    });
  });

  test('clamps edge clicks onto first and last category indices', () => {
    const convertFromPixel = () => [-0.4, 0.5];
    expect(resolveNearestMetricTrendCategoryIndex(convertFromPixel, 0, 40, 5, 400, 111)).toBe(0);

    const convertPastEnd = () => [4.6, 0.5];
    expect(resolveNearestMetricTrendCategoryIndex(convertPastEnd, 400, 40, 5, 400, 111)).toBe(4);
  });

  test('falls back to equal-slot x mapping when convertFromPixel fails', () => {
    const convertFromPixel = () => null;
    // plotLeft=4, plotRight=392, width=388 → ratio ~0 → first; ~1 → last
    expect(resolveNearestMetricTrendCategoryIndex(convertFromPixel, 4, 40, 5, 400, 111)).toBe(0);
    expect(resolveNearestMetricTrendCategoryIndex(convertFromPixel, 392, 40, 5, 400, 111)).toBe(4);
  });

  test('tooltip header shows run name and month-year timestamp with metric scores', () => {
    const runAt = new Date(2026, 1, 19, 10, 12).getTime();
    const runs: TrendsRunPoint[] = [
      {
        runId: 'r1',
        runName: 'Run #19',
        computedAtMs: runAt,
        overallScore: 0.5,
        durationMs: 100,
        isFailed: false,
      },
    ];
    const options = buildMetricTrendChartOptions(
      fallbackDarkTheme,
      runs,
      [{ name: 'faithfulness', color: '#30E070', values: [0.665] }],
      new Set(),
    );
    const formatter = (
      options.tooltip as {
        formatter: (
          params: {
            seriesName: string;
            value: unknown;
            color: string;
            dataIndex: number;
            data?: { value: number | null; runIndex: number };
          }[],
        ) => string;
      }
    ).formatter;

    const html = formatter([
      {
        seriesName: 'faithfulness',
        value: 0.665,
        color: '#30E070',
        dataIndex: 0,
        data: { value: 0.665, runIndex: 0 },
      },
    ]);

    expect(html).toContain('Run #19');
    expect(html).toContain('<a href=');
    expect(html).toContain('#2656D9');
    expect(html).toContain(formatMetricTrendTooltipDate(runAt));
    expect(html).toContain('faithfulness:');
    expect(html).toContain('0.665');
  });

  test('renders only visible series, filtering out hidden ones', () => {
    const options = buildMetricTrendChartOptions(fallbackDarkTheme, runOrder, series, new Set(['precision']));

    expect(options.series).toEqual([
      expect.objectContaining({
        name: 'faithfulness',
        type: 'line',
        data: [
          { value: 0.5, runIndex: 0 },
          { value: 0.7, runIndex: 1 },
        ],
      }),
    ]);
  });
});
