import { describe, expect, test } from 'vitest';

import { DEFAULT_TIME_PERIOD } from '@/src/constants/global-time-filter';

import { getSharableTimeFilter } from '../sharable-time-filter';

describe('getSharableTimeFilter', () => {
  test('returns a TimeRange unchanged', () => {
    const range = { startDate: new Date('2026-01-01T00:00:00.000Z'), endDate: new Date('2026-01-02T00:00:00.000Z') };

    expect(getSharableTimeFilter(range)).toBe(range);
  });

  test('returns a known preset id unchanged', () => {
    expect(getSharableTimeFilter('1h')).toBe('1h');
  });

  test('falls back to DEFAULT_TIME_PERIOD for an id no shared preset resolves', () => {
    expect(getSharableTimeFilter('since-creation')).toBe(DEFAULT_TIME_PERIOD);
  });
});
