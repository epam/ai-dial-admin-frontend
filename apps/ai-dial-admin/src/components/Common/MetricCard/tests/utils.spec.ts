import { describe, expect, test } from 'vitest';

import { MetricStatus } from '@/src/components/Common/MetricCard/models';
import { getChartColors, getStatusColor } from '@/src/components/Common/MetricCard/utils';
import { fallbackDarkTheme, fallbackLightTheme } from '@/src/utils/themes/constant';

describe('getChartColors', () => {
  test.each([fallbackDarkTheme, fallbackLightTheme])('maps chart roles onto palette keys', (palette) => {
    expect(getChartColors(palette)).toEqual({
      success: palette['text-success'],
      warning: palette['text-warning'],
      error: palette['text-error'],
      accent: palette['text-accent-primary'],
      neutral: palette['text-secondary'],
      value: palette['text-primary'],
      track: palette['bg-layer-4'],
    });
  });
});

describe('getStatusColor', () => {
  const colors = getChartColors(fallbackDarkTheme);

  test.each([
    [MetricStatus.Ok, colors.success],
    [MetricStatus.Warn, colors.warning],
    [MetricStatus.Crit, colors.error],
    [MetricStatus.Neutral, colors.accent],
    [MetricStatus.NoData, colors.neutral],
  ])('%s → its chart color', (status, expected) => {
    expect(getStatusColor(colors, status)).toBe(expected);
  });
});
