import { ValidityPeriods } from '@/src/types/key';
import { calculateExpirationDate } from '@/src/utils/keys';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

describe('Utils :: date :: calculateExpirationDate', () => {
  const fixedDate = new Date(Date.UTC(2025, 0, 1));

  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(fixedDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('returns timestamp + 1 day for DAY period', () => {
    const result = calculateExpirationDate(ValidityPeriods.DAY);
    const expected = new Date();
    expected.setDate(expected.getDate() + 1);
    expect(result).toBe(expected.toISOString());
  });

  test('returns timestamp + 7 days for WEEK period', () => {
    const result = calculateExpirationDate(ValidityPeriods.WEEK);
    const expected = new Date();
    expected.setDate(expected.getDate() + 7);
    expect(result).toBe(expected.toISOString());
  });

  test('returns timestamp + 1 month for MONTH period', () => {
    const result = calculateExpirationDate(ValidityPeriods.MONTH);
    const expected = new Date();
    expected.setMonth(expected.getMonth() + 1);
    expect(result).toBe(expected.toISOString());
  });

  test('returns timestamp + 3 months for THREE_MONTHS period', () => {
    const result = calculateExpirationDate(ValidityPeriods.THREE_MONTHS);
    const expected = new Date();
    expected.setMonth(expected.getMonth() + 3);
    expect(result).toBe(expected.toISOString());
  });

  test('returns timestamp + 6 months for SIX_MONTHS period', () => {
    const result = calculateExpirationDate(ValidityPeriods.SIX_MONTHS);
    const expected = new Date();
    expected.setMonth(expected.getMonth() + 6);
    expect(result).toBe(expected.toISOString());
  });

  test('returns timestamp + 1 year for YEAR period', () => {
    const result = calculateExpirationDate(ValidityPeriods.YEAR);
    const expected = new Date();
    expected.setFullYear(expected.getFullYear() + 1);
    expect(result).toBe(expected.toISOString());
  });
});
