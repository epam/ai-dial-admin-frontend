import { describe, expect, test, vi } from 'vitest';
import { getTimeRangeById } from '../get-time-range-id';

const mockOffset = 1000 * 60 * 60; // 1 hour

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
});
