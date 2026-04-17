import { describe, test, expect } from 'vitest';
import { formatDate } from '../utils';

describe('formatDate', () => {
  test('Should return a string containing year, month, and day', () => {
    const result = formatDate(new Date(2026, 5, 5));
    expect(result).toContain('2026');
    expect(result).toContain('05');
    expect(result).toContain('06');
  });

  test('Should return consistent output for the same date', () => {
    const date = new Date(2026, 0, 15);
    expect(formatDate(date)).toBe(formatDate(new Date(2026, 0, 15)));
  });

  test('Should pad single-digit months and days', () => {
    const result = formatDate(new Date(2026, 0, 1));
    expect(result).toContain('01');
  });
});
