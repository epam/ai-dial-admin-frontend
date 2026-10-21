import { describe, expect, test } from 'vitest';

import { SINCE_CREATION_PERIOD_ID, timePeriodOptionsConfig } from '@/src/constants/global-time-filter';

import { getTimeFilterOptions } from '../since-creation-option';

const label = 'Telemetry.SinceCreation';

describe('getTimeFilterOptions', () => {
  test('appends a Since Creation option anchored to a parsed ISO createdAt string', () => {
    const createdAt = '2026-01-01T00:00:00.000Z';
    const result = getTimeFilterOptions(createdAt, label);

    expect(result).toEqual([
      ...timePeriodOptionsConfig,
      { value: SINCE_CREATION_PERIOD_ID, label, startDate: new Date(createdAt) },
    ]);
  });

  test('appends a Since Creation option anchored to a parsed numeric-millisecond createdAt string', () => {
    const createdAtMs = Date.UTC(2026, 0, 1);
    const result = getTimeFilterOptions(String(createdAtMs), label);

    expect(result).toEqual([
      ...timePeriodOptionsConfig,
      { value: SINCE_CREATION_PERIOD_ID, label, startDate: new Date(createdAtMs) },
    ]);
  });

  test('returns the shared preset list unchanged when createdAt is undefined', () => {
    expect(getTimeFilterOptions(undefined, label)).toBe(timePeriodOptionsConfig);
  });

  test('returns the shared preset list unchanged when createdAt is an empty string', () => {
    expect(getTimeFilterOptions('', label)).toBe(timePeriodOptionsConfig);
  });

  test('returns the shared preset list unchanged when createdAt cannot be parsed', () => {
    expect(getTimeFilterOptions('not-a-date', label)).toBe(timePeriodOptionsConfig);
  });
});
