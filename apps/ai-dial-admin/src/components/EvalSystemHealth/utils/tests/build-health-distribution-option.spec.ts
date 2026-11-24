import { describe, expect, test } from 'vitest';

import { ChartColors } from '@/src/components/Common/MetricCard/models';
import { HealthDistributionBar } from '@/src/components/EvalSystemHealth/models';
import { buildHealthDistributionOption } from '@/src/components/EvalSystemHealth/utils/build-health-distribution-option';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';

const COLORS: ChartColors = {
  success: '#00aa00',
  warning: '#aaaa00',
  error: '#aa0000',
  accent: '#0000aa',
  neutral: '#888888',
  value: '#111111',
  track: '#222222',
};

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${JSON.stringify(params)}` : key;

const bar = (overrides: Partial<HealthDistributionBar> = {}): HealthDistributionBar => ({
  weekStart: 1762128000000,
  label: 'Nov 3',
  healthyCount: 21,
  failingCount: 11,
  suiteCount: 32,
  healthyShare: 65.6,
  failingShare: 34.4,
  ...overrides,
});

const emptyBar = bar({
  label: 'Nov 10',
  healthyCount: 0,
  failingCount: 0,
  suiteCount: 0,
  healthyShare: null,
  failingShare: null,
});

type SeriesOption = {
  name: string;
  stack: string;
  data: (number | null)[];
  itemStyle: { color: string };
  label: { show: boolean };
};

type AxisOption = { data?: string[]; min?: number; max?: number };

const build = (bars: HealthDistributionBar[]) => buildHealthDistributionOption(bars, COLORS, t);
const seriesOf = (bars: HealthDistributionBar[]) => build(bars).series as SeriesOption[];
const tooltipText = (bars: HealthDistributionBar[], dataIndex: number) =>
  (build(bars).tooltip as { formatter: (params: { dataIndex: number }[]) => string }).formatter([{ dataIndex }]);

describe('buildHealthDistributionOption', () => {
  test('labels the x-axis with the weeks in order', () => {
    expect((build([bar(), emptyBar]).xAxis as AxisOption).data).toEqual(['Nov 3', 'Nov 10']);
  });

  test('fixes the value axis to 0–100 so every bar with data reaches the top', () => {
    const yAxis = build([bar()]).yAxis as AxisOption;

    expect(yAxis.min).toBe(0);
    expect(yAxis.max).toBe(100);
  });

  test('stacks the failing share under the healthy one, in the error and success colours', () => {
    const [fail, healthy] = seriesOf([bar()]);

    expect(fail.stack).toBe(healthy.stack);
    expect(fail.itemStyle.color).toBe(COLORS.error);
    expect(healthy.itemStyle.color).toBe(COLORS.success);
    expect(fail.data).toEqual([34.4]);
    expect(healthy.data).toEqual([65.6]);
  });

  test('draws no bar for a week with no suite but keeps its place on the axis', () => {
    const [fail, healthy] = seriesOf([bar(), emptyBar]);

    expect(fail.data).toEqual([34.4, null]);
    expect(healthy.data).toEqual([65.6, null]);
  });

  test('shows no label on either band', () => {
    expect(seriesOf([bar()]).every((series) => series.label.show === false)).toBe(true);
  });

  test('states the week and each band count and share in the tooltip', () => {
    const text = tooltipText([bar()], 0);

    expect(text).toContain(
      `${EvalSystemHealthI18nKey.HealthDistributionTooltipWeek}:${JSON.stringify({ date: 'Nov 3' })}`,
    );
    expect(text).toContain(
      `${EvalSystemHealthI18nKey.HealthDistributionTooltipHealthy}:${JSON.stringify({ count: 21, share: '65.6%' })}`,
    );
    expect(text).toContain(
      `${EvalSystemHealthI18nKey.HealthDistributionTooltipFail}:${JSON.stringify({ count: 11, share: '34.4%' })}`,
    );
  });

  test('puts the healthy line before the failing one', () => {
    const text = tooltipText([bar()], 0);

    expect(text.indexOf(EvalSystemHealthI18nKey.HealthDistributionTooltipHealthy)).toBeLessThan(
      text.indexOf(EvalSystemHealthI18nKey.HealthDistributionTooltipFail),
    );
  });

  test('offers no tooltip for a week with no suite', () => {
    expect(tooltipText([bar(), emptyBar], 1)).toBe('');
  });

  test('offers no tooltip for a position outside the bars', () => {
    expect(tooltipText([bar()], 5)).toBe('');
  });
});
