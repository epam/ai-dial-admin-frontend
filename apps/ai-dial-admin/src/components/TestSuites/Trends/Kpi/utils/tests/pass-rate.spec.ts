import { describe, expect, test } from 'vitest';

import {
  formatPassRateDelta,
  formatPassRatePercent,
  passRateBarColor,
  segmentPassRate,
} from '@/src/components/TestSuites/Trends/Kpi/utils/pass-rate';

describe('segmentPassRate', () => {
  test('returns null when segments are missing or empty', () => {
    expect(segmentPassRate(null)).toBeNull();
    expect(segmentPassRate({ above: 0, total: 0 })).toBeNull();
  });

  test('returns above / total', () => {
    expect(segmentPassRate({ above: 197, total: 200 })).toBe(0.985);
  });
});

describe('passRateBarColor', () => {
  test('maps rate bands to green, yellow, and red', () => {
    expect(passRateBarColor(0.7)).toBe('#4dc87a');
    expect(passRateBarColor(0.985)).toBe('#4dc87a');
    expect(passRateBarColor(0.4)).toBe('#d4be3a');
    expect(passRateBarColor(0.69)).toBe('#d4be3a');
    expect(passRateBarColor(0.39)).toBe('#ff4e50');
  });
});

describe('formatPassRatePercent', () => {
  test('formats one decimal and strips trailing zeros', () => {
    expect(formatPassRatePercent(0.985)).toBe('98.5%');
    expect(formatPassRatePercent(1)).toBe('100%');
    expect(formatPassRatePercent(0.5)).toBe('50%');
  });
});

describe('formatPassRateDelta', () => {
  test('returns signed percentage-point delta', () => {
    expect(formatPassRateDelta(0.985, 0.665)).toBe('+32%');
    expect(formatPassRateDelta(0.5, 0.7)).toBe('-20%');
  });

  test('returns null when either rate is missing or delta is zero', () => {
    expect(formatPassRateDelta(null, 0.5)).toBeNull();
    expect(formatPassRateDelta(0.5, null)).toBeNull();
    expect(formatPassRateDelta(0.5, 0.5)).toBeNull();
  });
});
