import { describe, expect, test } from 'vitest';

import { parseDateText, toDateText, toTypedRange } from '@/src/components/Analytics/QueryBuilder/Chips/utils/period';

const TODAY = new Date(2026, 10, 16, 12, 0);

describe('toDateText', () => {
  test('writes a date as year, month and day in local time', () => {
    expect(toDateText(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(toDateText(new Date(2026, 10, 16))).toBe('2026-11-16');
  });

  test('writes nothing for a missing date', () => {
    expect(toDateText(null)).toBe('');
    expect(toDateText()).toBe('');
  });
});

describe('parseDateText', () => {
  test('reads a year-month-day text as local midnight, ignoring outer spaces', () => {
    expect(parseDateText('2026-11-09')).toEqual(new Date(2026, 10, 9));
    expect(parseDateText(' 2026-01-31 ')).toEqual(new Date(2026, 0, 31));
  });

  test('rejects text in another shape', () => {
    expect(parseDateText('')).toBeNull();
    expect(parseDateText('09.11.2026')).toBeNull();
    expect(parseDateText('2026-11-9')).toBeNull();
    expect(parseDateText('2026-11-09T10:00')).toBeNull();
  });

  test('rejects a day the calendar does not have', () => {
    expect(parseDateText('2026-02-30')).toBeNull();
    expect(parseDateText('2026-13-01')).toBeNull();
    expect(parseDateText('2026-00-10')).toBeNull();
  });
});

describe('toTypedRange', () => {
  test('spans from the start of the first day to the end of the last', () => {
    expect(toTypedRange('2026-11-09', '2026-11-12', TODAY)).toEqual({
      startDate: new Date(2026, 10, 9),
      endDate: new Date(2026, 10, 12, 23, 59, 59, 999),
    });
  });

  test('accepts one day as its own range, today included', () => {
    expect(toTypedRange('2026-11-16', '2026-11-16', TODAY)).toEqual({
      startDate: new Date(2026, 10, 16),
      endDate: new Date(2026, 10, 16, 23, 59, 59, 999),
    });
  });

  test('gives no range while either date is missing or unreadable', () => {
    expect(toTypedRange('2026-11-09', '', TODAY)).toBeNull();
    expect(toTypedRange('', '2026-11-12', TODAY)).toBeNull();
    expect(toTypedRange('yesterday', '2026-11-12', TODAY)).toBeNull();
  });

  test('gives no range when the end precedes the start or lies in the future', () => {
    expect(toTypedRange('2026-11-12', '2026-11-09', TODAY)).toBeNull();
    expect(toTypedRange('2026-11-09', '2026-11-17', TODAY)).toBeNull();
  });
});
