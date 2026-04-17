import { describe, expect, test } from 'vitest';

import { isTimeRange, isRangeIncludingToday } from '../time-range';

describe('isTimeRange', () => {
  test('returns true for TimeRange object', () => {
    expect(isTimeRange({ startDate: new Date(), endDate: new Date() })).toBe(true);
  });

  test('returns false for string', () => {
    expect(isTimeRange('2d')).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isTimeRange(undefined)).toBe(false);
  });
});

describe('isRangeIncludingToday', () => {
  test('returns true when endDate is today', () => {
    const today = new Date();
    const range = { startDate: new Date(today.getTime() - 2 * 86400000), endDate: today };
    expect(isRangeIncludingToday(range)).toBe(true);
  });

  test('returns true when endDate is in the future', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const range = { startDate: new Date(), endDate: tomorrow };
    expect(isRangeIncludingToday(range)).toBe(true);
  });

  test('returns false when endDate is yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const range = { startDate: new Date(yesterday.getTime() - 86400000), endDate: yesterday };
    expect(isRangeIncludingToday(range)).toBe(false);
  });

  test('returns true when range is a single day (today)', () => {
    const today = new Date();
    const range = { startDate: today, endDate: today };
    expect(isRangeIncludingToday(range)).toBe(true);
  });
});
