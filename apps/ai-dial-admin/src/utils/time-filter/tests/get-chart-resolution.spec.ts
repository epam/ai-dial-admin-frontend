import { describe, expect, test } from 'vitest';
import { formatWindow, getChartResolution } from '../get-chart-resolution';
import { TimeRange } from '@/src/models/time-range';

const makeRange = (durationMinutes: number): TimeRange => {
  const end = new Date('2026-01-15T12:00:00Z');
  const start = new Date(end.getTime() - durationMinutes * 60 * 1000);
  return { startDate: start, endDate: end };
};

describe('getChartResolution', () => {
  test.each([
    { period: '15m', minutes: 15, expected: { value: 1, unit: 'm' } },
    { period: '30m', minutes: 30, expected: { value: 1, unit: 'm' } },
    { period: '1h', minutes: 60, expected: { value: 1, unit: 'm' } },
    { period: '3h', minutes: 180, expected: { value: 1, unit: 'm' } },
    { period: '6h', minutes: 360, expected: { value: 2, unit: 'm' } },
    { period: '12h', minutes: 720, expected: { value: 5, unit: 'm' } },
    { period: '24h', minutes: 1440, expected: { value: 10, unit: 'm' } },
    { period: '2d', minutes: 2880, expected: { value: 15, unit: 'm' } },
    { period: '7d', minutes: 10080, expected: { value: 1, unit: 'h' } },
    { period: '30d', minutes: 43200, expected: { value: 6, unit: 'h' } },
  ])('returns $expected.value$expected.unit for $period ($minutes min)', ({ minutes, expected }) => {
    const result = getChartResolution(makeRange(minutes));
    expect(result).toEqual(expected);
  });

  test('returns 1d for very long ranges', () => {
    const result = getChartResolution(makeRange(365 * 24 * 60));
    expect(result).toEqual({ value: 1, unit: 'd' });
  });

  test('returns 1m for very short ranges', () => {
    const result = getChartResolution(makeRange(2));
    expect(result).toEqual({ value: 1, unit: 'm' });
  });
});

describe('formatWindow', () => {
  test('formats minutes resolution', () => {
    expect(formatWindow({ value: 5, unit: 'm' })).toBe("window(_time, 5, 'm')");
  });

  test('formats hours resolution', () => {
    expect(formatWindow({ value: 6, unit: 'h' })).toBe("window(_time, 6, 'h')");
  });

  test('formats days resolution', () => {
    expect(formatWindow({ value: 1, unit: 'd' })).toBe("window(_time, 1, 'd')");
  });
});
