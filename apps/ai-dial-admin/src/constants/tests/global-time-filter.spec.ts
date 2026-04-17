import { describe, expect, test } from 'vitest';

import {
  DEFAULT_TIME_PERIOD,
  getDefaultTimePeriod,
  getFilteredTimePeriodOptions,
  getTimePeriodOptionsByMaxDays,
  timePeriodOptionsConfig,
} from '../global-time-filter';

describe('Constants :: global-time-filter', () => {
  describe('getFilteredTimePeriodOptions', () => {
    test('Should return options with offset <= maxTimeRangeMs', () => {
      const maxTimeRangeMs = 60 * 60 * 1000; // 1 hour
      const result = getFilteredTimePeriodOptions(maxTimeRangeMs);

      expect(result).toEqual([
        expect.objectContaining({ value: '15m' }),
        expect.objectContaining({ value: '30m' }),
        expect.objectContaining({ value: '1h' }),
      ]);
    });

    test('Should return empty array when maxTimeRangeMs is 0', () => {
      expect(getFilteredTimePeriodOptions(0)).toEqual([]);
    });

    test('Should return all options when maxTimeRangeMs is very large', () => {
      const result = getFilteredTimePeriodOptions(Number.MAX_SAFE_INTEGER);
      expect(result).toEqual(timePeriodOptionsConfig);
    });
  });

  describe('getTimePeriodOptionsByMaxDays', () => {
    test('Should return all options when maxDays is undefined', () => {
      expect(getTimePeriodOptionsByMaxDays()).toEqual(timePeriodOptionsConfig);
    });

    test('Should return options up to 3 days', () => {
      const result = getTimePeriodOptionsByMaxDays(3);
      const values = result.map((o) => o.value);
      expect(values).toContain('2d');
      expect(values).not.toContain('7d');
      expect(values).not.toContain('30d');
    });

    test('Should return options up to 10 days', () => {
      const result = getTimePeriodOptionsByMaxDays(10);
      const values = result.map((o) => o.value);
      expect(values).toContain('7d');
      expect(values).not.toContain('30d');
    });

    test('Should return all options for 31 days', () => {
      const result = getTimePeriodOptionsByMaxDays(31);
      const values = result.map((o) => o.value);
      expect(values).toContain('30d');
    });
  });

  describe('getDefaultTimePeriod', () => {
    test('Should return DEFAULT_TIME_PERIOD when it exists in options', () => {
      expect(getDefaultTimePeriod(timePeriodOptionsConfig)).toBe(DEFAULT_TIME_PERIOD);
    });

    test('Should return last option value when DEFAULT_TIME_PERIOD is not in options', () => {
      const options = [
        { value: '15m', label: 'Last 15m', offset: 15 * 60 * 1000 },
        { value: '1h', label: 'Last 1h', offset: 60 * 60 * 1000 },
      ];
      expect(getDefaultTimePeriod(options)).toBe('1h');
    });

    test('Should return DEFAULT_TIME_PERIOD for empty array', () => {
      expect(getDefaultTimePeriod([])).toBe(DEFAULT_TIME_PERIOD);
    });
  });
});
