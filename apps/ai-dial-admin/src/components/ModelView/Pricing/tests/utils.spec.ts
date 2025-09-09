import { describe, test, expect } from 'vitest';
import { getMultipliedValue } from '../utils';

describe('getMultipliedValue', () => {
  test('should multiply the value by 1,000,000 and round to 6 decimal places when isTokenType is true', () => {
    expect(getMultipliedValue('0.0000008', true)).toBe('0.8');
    expect(getMultipliedValue('0.00000009', true)).toBe('0.09');
    expect(getMultipliedValue('0.000000009', true)).toBe('0.009');
    expect(getMultipliedValue('0.0000000008', true)).toBe('0.0008');
    expect(getMultipliedValue('0.000001', true)).toBe('1');
  });

  test('should return the same value when isTokenType is false', () => {
    expect(getMultipliedValue('0.0000008', false)).toBe('0.0000008');
    expect(getMultipliedValue('100', false)).toBe('100');
    expect(getMultipliedValue('hello', false)).toBe('hello');
  });

  test('should return an empty string when the value is undefined and isTokenType is true', () => {
    expect(getMultipliedValue(undefined, true)).toBe('');
  });

  test('should return an empty string when the value is undefined and isTokenType is false', () => {
    expect(getMultipliedValue(undefined, false)).toBe('');
  });

  test('should return an empty string when the value is an empty string and isTokenType is true', () => {
    expect(getMultipliedValue('', true)).toBe('');
  });

  test('should return an empty string when the value is an empty string and isTokenType is false', () => {
    expect(getMultipliedValue('', false)).toBe('');
  });

  test('should handle invalid number values gracefully', () => {
    expect(getMultipliedValue('invalid', true)).toBe('NaN');
    expect(getMultipliedValue('invalid', false)).toBe('invalid');
  });
});
