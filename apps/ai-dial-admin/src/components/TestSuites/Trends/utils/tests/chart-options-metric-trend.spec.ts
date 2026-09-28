import { describe, expect, test } from 'vitest';

import { buildMetricTrendChartOptions } from '@/src/components/TestSuites/Trends/utils/chart-options';
import { MetricTrendSeries, TrendsRunPoint } from '@/src/components/TestSuites/Trends/models';

describe('buildMetricTrendChartOptions', () => {
  const runOrder: TrendsRunPoint[] = [
    { runId: 'r1', runName: 'Run1', computedAtMs: 1, overallScore: 0.4, durationMs: 100, isFailed: false },
    { runId: 'r2', runName: 'Run2', computedAtMs: 2, overallScore: 0.5, durationMs: 120, isFailed: true },
  ];

  const series: MetricTrendSeries[] = [
    { name: 'faithfulness', color: '#30E070', values: [0.5, 0.7] },
    { name: 'precision', color: '#D4BE3A', values: [0.4, 0.6] },
  ];

  test('fixes the score domain to 0-1 with 0.25 intervals', () => {
    const options = buildMetricTrendChartOptions(runOrder, series, new Set(), 'Run');

    expect(options.yAxis).toMatchObject({ type: 'value', min: 0, max: 1, interval: 0.25 });
  });

  test('shows Y-axis labels and reserves non-zero left grid space for them', () => {
    const options = buildMetricTrendChartOptions(runOrder, series, new Set(), 'Run');

    expect(options.yAxis).toMatchObject({ axisLabel: { show: true } });
    expect((options.grid as { left: number }).left).toBeGreaterThan(0);
  });

  test('keeps the X axis hidden and Y-axis split lines visible', () => {
    const options = buildMetricTrendChartOptions(runOrder, series, new Set(), 'Run');

    expect(options.xAxis).toMatchObject({ show: false });
    expect(options.yAxis).toMatchObject({ splitLine: { show: true } });
  });

  test('preserves tooltip trigger behavior', () => {
    const options = buildMetricTrendChartOptions(runOrder, series, new Set(), 'Run');

    expect(options.tooltip).toMatchObject({ trigger: 'axis' });
  });

  test('renders only visible series, filtering out hidden ones', () => {
    const options = buildMetricTrendChartOptions(runOrder, series, new Set(['precision']), 'Run');

    expect(options.series).toEqual([expect.objectContaining({ name: 'faithfulness', type: 'line', data: [0.5, 0.7] })]);
  });
});
