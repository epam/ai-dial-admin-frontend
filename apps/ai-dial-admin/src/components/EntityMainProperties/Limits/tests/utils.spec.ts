import { describe, expect, test } from 'vitest';

import { UNLIMITED_VALUE } from '@/src/constants/role';
import { getCorrectValue } from '../utils';

describe('getCorrectValue', () => {
  test('returns empty string for undefined, null, false and UNLIMITED_VALUE', () => {
    expect(getCorrectValue(undefined)).toBe('');
    expect(getCorrectValue(null)).toBe('');
    expect(getCorrectValue(false)).toBe('');
    expect(getCorrectValue(UNLIMITED_VALUE)).toBe('');
  });

  test('keeps strings that start with 0 intact', () => {
    expect(getCorrectValue('0')).toBe('0');
    expect(getCorrectValue('0123')).toBe('0123');
  });

  test('formats numeric-like strings using Big (removes unnecessary trailing zeros)', () => {
    expect(getCorrectValue('100')).toBe('100');
    expect(getCorrectValue('1.2300')).toBe('1.23');
  });

  test('throws for non-numeric strings or unexpected true boolean', () => {
    expect(() => getCorrectValue('abc' as any)).toThrow();
    expect(() => getCorrectValue(true as any)).toThrow();
  });
});
