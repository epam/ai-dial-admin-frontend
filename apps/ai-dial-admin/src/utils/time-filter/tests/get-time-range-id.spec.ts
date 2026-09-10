import { describe, expect, test, vi } from 'vitest';

import {
  AnchoredTimePeriodOption,
  TimeFilterOption,
  timePeriodOptionsConfig,
} from '@/src/constants/global-time-filter';

import { getTimeRangeById } from '../get-time-range-id';

const mockOffset = 1000 * 60 * 60; // 1 hour

const anchor = new Date('2026-01-01T00:00:00.000Z');
const anchoredOption: AnchoredTimePeriodOption = {
  value: 'since-creation',
  label: 'Since Creation',
  startDate: anchor,
};
const options: TimeFilterOption[] = [{ value: '1h', label: 'Last 1h', offset: mockOffset }, anchoredOption];

describe('getTimeRangeById', () => {
  test('returns correct time range for known id', () => {
    const now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const result = getTimeRangeById('1h');
    expect(result.endDate.getTime()).toBe(now);
    expect(result.startDate.getTime()).toBe(now - mockOffset);

    vi.useRealTimers();
  });

  test('returns now for unknown id', () => {
    const now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const result = getTimeRangeById('unknown');
    expect(result.endDate.getTime()).toBe(now);
    expect(result.startDate.getTime()).toBe(now);

    vi.useRealTimers();
  });

  test('resolves an anchored option to its own startDate and now, in a fresh Date instance', () => {
    const now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const result = getTimeRangeById('since-creation', options);

    expect(result.startDate.getTime()).toBe(anchor.getTime());
    expect(result.startDate).not.toBe(anchoredOption.startDate);
    expect(result.endDate.getTime()).toBe(now);

    vi.useRealTimers();
  });

  test('anchored resolution recomputes endDate against the current clock, not a frozen value', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-05T00:00:00.000Z'));

    const first = getTimeRangeById('since-creation', options);
    expect(first.endDate.getTime()).toBe(new Date('2026-01-05T00:00:00.000Z').getTime());

    vi.setSystemTime(new Date('2026-01-06T00:00:00.000Z'));
    const second = getTimeRangeById('since-creation', options);
    expect(second.endDate.getTime()).toBe(new Date('2026-01-06T00:00:00.000Z').getTime());
    expect(second.startDate.getTime()).toBe(anchor.getTime());

    vi.useRealTimers();
  });

  test('the default options parameter leaves an existing sliding id resolving exactly as calling with the shared config explicitly', () => {
    const now = Date.now();
    vi.useFakeTimers();
    vi.setSystemTime(now);

    const withDefault = getTimeRangeById('2d');
    const withExplicitConfig = getTimeRangeById('2d', timePeriodOptionsConfig);

    expect(withDefault).toEqual(withExplicitConfig);
    expect(withDefault.startDate.getTime()).toBe(now - 2 * 24 * 60 * 60 * 1000);
    expect(withDefault.endDate.getTime()).toBe(now);

    vi.useRealTimers();
  });
});
