import { describe, expect, test } from 'vitest';

import {
  formatScore,
  formatSuiteRunTime,
  formatTrendAxisDate,
  formatTrendTooltipDate,
} from '@/src/components/TestSuites/Trends/utils/format';

describe('Trends format helpers', () => {
  test('formatSuiteRunTime uses ms under one second and seconds otherwise', () => {
    expect(formatSuiteRunTime(341)).toBe('341ms');
    expect(formatSuiteRunTime(1500)).toBe('1.5s');
  });

  test('formatScore rounds to three decimals', () => {
    expect(formatScore(0.5804)).toBe('0.58');
    expect(formatScore(0.583)).toBe('0.583');
  });

  test('formats axis and tooltip dates', () => {
    const ms = new Date(2026, 1, 27).getTime();
    expect(formatTrendAxisDate(ms)).toContain('Feb');
    expect(formatTrendTooltipDate(ms)).toContain('Feb');
  });
});
