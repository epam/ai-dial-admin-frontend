import { describe, expect, test } from 'vitest';

import {
  DEFAULT_TIME_PERIOD,
  getDefaultTimePeriod,
  getTimePeriodOptionsByMaxMs,
  timePeriodOptionsConfig,
} from '../global-time-filter';

describe('Constants :: global-time-filter', () => {
  describe('getTimePeriodOptionsByMaxMs', () => {
    test('Should return all options when maxRangeMs is undefined', () => {
      expect(getTimePeriodOptionsByMaxMs()).toEqual(timePeriodOptionsConfig);
    });

    test('Should return all options when passing options but no maxRangeMs', () => {
      expect(getTimePeriodOptionsByMaxMs(timePeriodOptionsConfig)).toEqual(timePeriodOptionsConfig);
    });

    test('Should return options with offset <= maxRangeMs (1 hour)', () => {
      const maxRangeMs = 60 * 60 * 1000;
      const result = getTimePeriodOptionsByMaxMs(timePeriodOptionsConfig, maxRangeMs);

      expect(result.map((o) => o.value)).toEqual(['15m', '30m', '1h']);
    });

    test('Should return options up to 3 days', () => {
      const result = getTimePeriodOptionsByMaxMs(timePeriodOptionsConfig, 3 * 24 * 60 * 60 * 1000);
      const values = result.map((o) => o.value);
      expect(values).toContain('2d');
      expect(values).not.toContain('7d');
      expect(values).not.toContain('30d');
    });

    test('Should return empty array when maxRangeMs is 0', () => {
      expect(getTimePeriodOptionsByMaxMs(timePeriodOptionsConfig, 0)).toEqual([]);
    });

    test('Should return all options when maxRangeMs is very large', () => {
      expect(getTimePeriodOptionsByMaxMs(timePeriodOptionsConfig, Number.MAX_SAFE_INTEGER)).toEqual(
        timePeriodOptionsConfig,
      );
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
