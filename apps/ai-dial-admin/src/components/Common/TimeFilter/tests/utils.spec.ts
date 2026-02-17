import { describe, test, expect, vi } from 'vitest';
import { formatDate } from '../utils';

describe('formatDate', () => {
  test('Should return date formatted as MM-DD-YYYY', () => {
    expect(formatDate(new Date(2026, 5, 5))).toBe('06-05-2026');
    expect(formatDate(new Date(2026, 10, 10))).toBe('11-10-2026');
    expect(formatDate(new Date(2026, 0, 1))).toBe('01-01-2026');
  });
});
