import { describe, expect, test } from 'vitest';

import {
  formatCompactNumber,
  formatDuration,
  formatMoney,
  formatPercent,
  getDeltaRatio,
} from '@/src/components/Analytics/Usage/utils/format';

describe('formatCompactNumber', () => {
  test('leaves a figure below a thousand whole and unitless', () => {
    expect(formatCompactNumber(829)).toEqual({ value: '829' });
  });

  test('rounds a fractional figure that needs no unit', () => {
    expect(formatCompactNumber(12.4)).toEqual({ value: '12' });
  });

  test.each([
    [1500, { value: '1.5', unit: 'K' }],
    [2_200_000, { value: '2.2', unit: 'M' }],
    [16_700_000_000, { value: '16.7', unit: 'B' }],
  ])('abbreviates %i to the unit that keeps it short', (value, expected) => {
    expect(formatCompactNumber(value)).toEqual(expected);
  });

  test('abbreviates a negative figure by its magnitude', () => {
    expect(formatCompactNumber(-1500)).toEqual({ value: '-1.5', unit: 'K' });
  });

  test('returns a plain zero', () => {
    expect(formatCompactNumber(0)).toEqual({ value: '0' });
  });
});

describe('formatMoney', () => {
  test('keeps cents on an amount under a thousand', () => {
    expect(formatMoney(49.756)).toEqual({ value: '$49.76' });
  });

  test('abbreviates an amount of a thousand or more', () => {
    expect(formatMoney(1699)).toEqual({ value: '$1.7', unit: 'K' });
  });

  test('renders zero with cents rather than as a bare figure', () => {
    expect(formatMoney(0)).toEqual({ value: '$0.00' });
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
