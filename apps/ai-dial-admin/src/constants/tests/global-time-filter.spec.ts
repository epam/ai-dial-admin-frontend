import { describe, expect, test } from 'vitest';

import {
  AnchoredTimePeriodOption,
  DEFAULT_TIME_PERIOD,
  TimePeriodOption,
  getDefaultTimePeriod,
  getTimePeriodOptionsByMaxMs,
  isAnchoredTimePeriodOption,
  timePeriodOptionsConfig,
} from '../global-time-filter';

const anchoredOption: AnchoredTimePeriodOption = {
  value: 'since-creation',
  label: 'Since Creation',
  startDate: new Date('2026-01-01T00:00:00.000Z'),
};

const slidingOption: TimePeriodOption = { value: '1h', label: 'Last 1h', offset: 60 * 60 * 1000 };

// An option that carries both fields at once — not produced by any helper in this codebase, but
// worth pinning down because `isAnchoredTimePeriodOption` discriminates on `'startDate' in option`.
const bothFieldsOption = { ...slidingOption, startDate: new Date('2026-01-01T00:00:00.000Z') };

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

  describe('isAnchoredTimePeriodOption', () => {
    test('returns true for an option carrying startDate', () => {
      expect(isAnchoredTimePeriodOption(anchoredOption)).toBe(true);
    });

    test('returns false for a sliding option carrying only offset', () => {
      expect(isAnchoredTimePeriodOption(slidingOption)).toBe(false);
    });

    test('returns true for an option carrying both startDate and offset', () => {
      expect(isAnchoredTimePeriodOption(bothFieldsOption)).toBe(true);
    });
  });

  describe('getTimePeriodOptionsByMaxMs — anchored options', () => {
    test('drops an anchored option when a cap is set, alongside any sliding option over the cap', () => {
      const options = [slidingOption, anchoredOption];
      const result = getTimePeriodOptionsByMaxMs(options, 60 * 60 * 1000);

      expect(result).toEqual([slidingOption]);
    });

    test('keeps an anchored option when no cap is set', () => {
      const options = [slidingOption, anchoredOption];

      expect(getTimePeriodOptionsByMaxMs(options)).toEqual(options);
    });

    test('drops an option carrying both startDate and offset when a cap is set, even though its offset is within the cap', () => {
      // isAnchoredTimePeriodOption discriminates on `startDate`, so this option is treated as
      // anchored and dropped — the `offset` field does not rescue it.
      const options = [bothFieldsOption];
      const result = getTimePeriodOptionsByMaxMs(options, 60 * 60 * 1000);

      expect(result).toEqual([]);
    });
  });
});
