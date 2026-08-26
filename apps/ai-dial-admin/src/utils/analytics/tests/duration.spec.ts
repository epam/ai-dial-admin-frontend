import { describe, expect, test } from 'vitest';

import { DurationUnit, formatDuration, parseDuration } from '@/src/utils/analytics/duration';

describe('Utils :: analytics :: parseDuration', () => {
  test.each([
    ['10m', 10, DurationUnit.Minutes],
    ['500ms', 500, DurationUnit.Milliseconds],
    ['30s', 30, DurationUnit.Seconds],
    ['2h', 2, DurationUnit.Hours],
    ['7d', 7, DurationUnit.Days],
  ])('reads the short form %s', (value, amount, unit) => {
    expect(parseDuration(value)).toEqual({ amount, unit });
  });

  test.each([
    ['PT10M', 10, DurationUnit.Minutes],
    ['PT2H', 2, DurationUnit.Hours],
    ['PT30S', 30, DurationUnit.Seconds],
  ])('reads the ISO-8601 form %s', (value, amount, unit) => {
    expect(parseDuration(value)).toEqual({ amount, unit });
  });

  test('reads a lowercase ISO duration', () => {
    expect(parseDuration('pt10m')).toEqual({ amount: 10, unit: DurationUnit.Minutes });
  });

  test('returns null for a compound ISO duration', () => {
    expect(parseDuration('PT1H30M')).toBeNull();
  });

  test.each(['', undefined, 'soon', '10 minutes', '-5m', '1.5h', 'P1D'])('returns null for %s', (value) => {
    expect(parseDuration(value)).toBeNull();
  });

  test('tolerates surrounding whitespace', () => {
    expect(parseDuration('  10m  ')).toEqual({ amount: 10, unit: DurationUnit.Minutes });
  });
});

describe('Utils :: analytics :: formatDuration', () => {
  test('emits the short form', () => {
    expect(formatDuration({ amount: 10, unit: DurationUnit.Minutes })).toBe('10m');
  });

  test('round-trips a parsed short form', () => {
    const parsed = parseDuration('45s');
    expect(parsed && formatDuration(parsed)).toBe('45s');
  });

  test('normalises a parsed ISO duration to the short form', () => {
    const parsed = parseDuration('PT2H');
    expect(parsed && formatDuration(parsed)).toBe('2h');
  });
});
