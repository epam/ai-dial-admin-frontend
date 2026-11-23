import { describe, expect, test } from 'vitest';

import { msUntilNextLocalDay, startOfLocalDay } from '@/src/components/EvalSystemHealth/utils/local-day';

describe('startOfLocalDay', () => {
  test('returns the first instant of the local day', () => {
    expect(startOfLocalDay(new Date(2026, 10, 18, 15, 30, 45, 123))).toBe(new Date(2026, 10, 18).getTime());
  });

  test('keeps a date that is already the first instant', () => {
    expect(startOfLocalDay(new Date(2026, 10, 18))).toBe(new Date(2026, 10, 18).getTime());
  });

  test('stays on the same day one millisecond before midnight', () => {
    expect(startOfLocalDay(new Date(2026, 10, 18, 23, 59, 59, 999))).toBe(new Date(2026, 10, 18).getTime());
  });
});

describe('msUntilNextLocalDay', () => {
  test('counts the time left in the day', () => {
    expect(msUntilNextLocalDay(new Date(2026, 10, 18, 23, 59, 0))).toBe(60_000);
  });

  test('is the whole day at its first instant', () => {
    expect(msUntilNextLocalDay(new Date(2026, 10, 18))).toBe(
      new Date(2026, 10, 19).getTime() - new Date(2026, 10, 18).getTime(),
    );
  });

  test('crosses a month boundary', () => {
    expect(msUntilNextLocalDay(new Date(2026, 10, 30, 23, 0, 0))).toBe(
      new Date(2026, 11, 1).getTime() - new Date(2026, 10, 30, 23, 0, 0).getTime(),
    );
  });

  test('crosses a year boundary', () => {
    expect(msUntilNextLocalDay(new Date(2026, 11, 31, 12, 0, 0))).toBe(
      new Date(2027, 0, 1).getTime() - new Date(2026, 11, 31, 12, 0, 0).getTime(),
    );
  });
});
