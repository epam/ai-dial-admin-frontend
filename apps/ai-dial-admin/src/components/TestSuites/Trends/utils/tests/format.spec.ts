import { describe, expect, test } from 'vitest';

import {
  formatComboRuntimeSeconds,
  formatScore,
  formatSuiteRunTime,
  formatMetricTrendTooltipDate,
  formatTrendAxisDate,
  formatTrendAxisRunName,
} from '@/src/components/TestSuites/Trends/utils/format';

describe('Trends format helpers', () => {
  test('formatSuiteRunTime uses ms under one second and seconds otherwise', () => {
    expect(formatSuiteRunTime(341)).toBe('341ms');
    expect(formatSuiteRunTime(1500)).toBe('1.5s');
  });

  test('formatComboRuntimeSeconds always uses seconds', () => {
    expect(formatComboRuntimeSeconds(28)).toBe('0.028s');
    expect(formatComboRuntimeSeconds(1500)).toBe('1.5s');
    expect(formatComboRuntimeSeconds(117_000)).toBe('117s');
  });

  test('formatScore rounds to three decimals', () => {
    expect(formatScore(0.5804)).toBe('0.58');
    expect(formatScore(0.583)).toBe('0.583');
  });

  test('formats axis date with short month and four-digit year', () => {
    const ms = new Date(2026, 1, 27, 11, 40).getTime();
    expect(formatTrendAxisDate(ms)).toBe('Feb 2026');
  });

  test('formats trend tooltip date with month, year, and 24-hour time', () => {
    const ms = new Date(2026, 1, 19, 10, 12).getTime();
    const formatted = formatMetricTrendTooltipDate(ms);
    expect(formatted).toContain('Feb 2026');
    expect(formatted).toMatch(/10:12/);
  });

  test('strips a leading Run prefix for axis labels', () => {
    expect(formatTrendAxisRunName('Run #19')).toBe('#19');
    expect(formatTrendAxisRunName('Run#1')).toBe('#1');
    expect(formatTrendAxisRunName('run  #23')).toBe('#23');
    expect(formatTrendAxisRunName('af07786b-9acc-42de-a1b2')).toBe('af07786b-9acc-42de-a1b2');
    expect(formatTrendAxisRunName('My Run #19')).toBe('My Run #19');
  });
});
