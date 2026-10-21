import { describe, expect, test } from 'vitest';

import { DurationUnit, durationToMs, formatDuration, parseDuration } from '@/src/utils/analytics/duration';

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

describe('durationToMs', () => {
  test.each([
    ['250ms', 250],
    ['30s', 30_000],
    ['10m', 600_000],
    ['24h', 86_400_000],
    ['7d', 604_800_000],
    ['PT10M', 600_000],
    ['PT1H30M', 5_400_000],
    ['P1D', 86_400_000],
    ['P1DT2H', 93_600_000],
    ['PT1.5S', 1500],
  ])('reads %s as %d ms', (value, expected) => {
    expect(durationToMs(value)).toBe(expected);
  });

  test.each([undefined, '', 'soon', 'P', 'PT', 'P1DT', '10 minutes'])('reads %s as no duration', (value) => {
    expect(durationToMs(value)).toBeUndefined();
  });
});
