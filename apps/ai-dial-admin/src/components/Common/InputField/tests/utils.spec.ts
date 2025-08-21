import { describe, expect, test } from 'vitest';
import { getInputValue } from '../utils';

describe('getInputValue', () => {
  test('returns empty string for falsy input', () => {
    expect(getInputValue('')).toBe('');
    expect(getInputValue(0)).toBe('');
  });

  test('returns string with single leading zero for less than one pattern', () => {
    expect(getInputValue('00.123')).toBe('0.123');
    expect(getInputValue('000.456')).toBe('0.456');
    expect(getInputValue('0.789')).toBe('0.789');
  });

  test('returns number for normal numeric input', () => {
    expect(getInputValue('123')).toBe(123);
    expect(getInputValue(456)).toBe(456);
    expect(getInputValue('10')).toBe(10);
    expect(getInputValue('1.23')).toBe(1.23);
  });

  test('returns number for string with leading zeros not matching lessThanOnePattern', () => {
    expect(getInputValue('00123')).toBe(123);
    expect(getInputValue('00045')).toBe(45);
  });

  test('returns 0 for input "0"', () => {
    expect(getInputValue('0')).toBe(0);
  });
});
