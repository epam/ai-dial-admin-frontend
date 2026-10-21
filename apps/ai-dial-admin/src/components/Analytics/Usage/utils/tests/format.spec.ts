import { describe, expect, test } from 'vitest';

import {
  formatBucketRange,
  formatCompactNumber,
  formatDuration,
  formatGroupedMoney,
  formatGroupedNumber,
  formatMoney,
  formatPercent,
  getDeltaRatio,
} from '@/src/components/Analytics/Usage/utils/format';

describe('formatCompactNumber', () => {
  test('leaves a figure below a thousand whole and unitless', () => {
    expect(formatCompactNumber(829)).toEqual({ value: '829' });
  });

  test.each([
    [1500, { value: '1.5', unit: 'K' }],
    [2_200_000, { value: '2.2', unit: 'M' }],
    [16_700_000_000, { value: '16.7', unit: 'B' }],
  ])('abbreviates %i to the unit that keeps it short', (value, expected) => {
    expect(formatCompactNumber(value)).toEqual(expected);
  });

  test('abbreviates a negative figure by its magnitude', () => {
    expect(formatCompactNumber(-2500)).toEqual({ value: '-2.5', unit: 'K' });
  });
});

describe('formatMoney', () => {
  test('keeps cents on an amount under a thousand', () => {
    expect(formatMoney(12.3456)).toEqual({ value: '$12.35' });
  });

  test('abbreviates a larger amount, carrying the unit separately', () => {
    expect(formatMoney(12_345)).toEqual({ value: '$12.3', unit: 'K' });
  });
});

describe('formatGroupedNumber', () => {
  test('groups the thousands of a large figure', () => {
    expect(formatGroupedNumber(1000000)).toBe('1,000,000');
  });

  test('rounds to whole digits by default, since a call count has no fraction', () => {
    expect(formatGroupedNumber(38104.6)).toBe('38,105');
  });

  test('keeps the fraction a caller asks for', () => {
    expect(formatGroupedNumber(1234.5, 2)).toBe('1,234.50');
  });

  test('groups a negative figure by its digits, keeping the sign', () => {
    expect(formatGroupedNumber(-2200000)).toBe('-2,200,000');
  });

  test('states a zero plainly', () => {
    expect(formatGroupedNumber(0)).toBe('0');
  });
});

describe('formatGroupedMoney', () => {
  test('keeps cents and groups the thousands', () => {
    expect(formatGroupedMoney(12345.678)).toBe('$12,345.68');
  });

  test('keeps cents on a small amount rather than rounding them away', () => {
    expect(formatGroupedMoney(1.19)).toBe('$1.19');
  });
});

describe('formatPercent', () => {
  test('renders a ratio with one decimal by default', () => {
    expect(formatPercent(0.284)).toBe('28.4%');
  });

  test('honours a requested precision', () => {
    expect(formatPercent(0.0123, 2)).toBe('1.23%');
    expect(formatPercent(0.284, 0)).toBe('28%');
  });
});

describe('getDeltaRatio', () => {
  test('states the change from the previous window', () => {
    expect(getDeltaRatio(150, 100)).toBe(0.5);
  });

  test.each([
    ['the current figure is unknown', null, 100],
    ['the previous figure is unknown', 100, null],
    ['the previous figure is zero, which has no ratio', 100, 0],
  ])('returns nothing when %s', (_case, current, previous) => {
    expect(getDeltaRatio(current, previous)).toBeNull();
  });
});

describe('formatDuration', () => {
  test('keeps a sub-second latency in milliseconds', () => {
    expect(formatDuration(703.4)).toEqual({ value: '703', unit: 'ms' });
  });

  test('switches to seconds at a second and above', () => {
    expect(formatDuration(1000)).toEqual({ value: '1.0', unit: 's' });
    expect(formatDuration(7480)).toEqual({ value: '7.5', unit: 's' });
  });
});

describe('formatBucketRange', () => {
  const HOUR_MS = 60 * 60 * 1000;
  const DAY_MS = 24 * HOUR_MS;
  const start = new Date('2026-09-22T02:00:00.000Z').getTime();

  test('states both ends of a sub-day bucket, naming the day once', () => {
    const range = formatBucketRange(start, 2 * HOUR_MS);

    expect(range).toContain('–');
    expect(range.split('–')[1]).not.toContain('Sep');
  });

  test('names the second day when the bucket crosses midnight', () => {
    // Built in local time, since the range is rendered in the reader's own: a UTC instant would
    // cross midnight only in some zones.
    const range = formatBucketRange(new Date(2026, 8, 22, 23, 0, 0).getTime(), 2 * HOUR_MS);

    expect(range.split('–')[1]).toContain('Sep');
  });

  test('drops the clock for a bucket of a day or more', () => {
    const range = formatBucketRange(start, DAY_MS);

    expect(range).not.toMatch(/\d{2}:\d{2}/);
    expect(range).toContain('–');
  });
});
