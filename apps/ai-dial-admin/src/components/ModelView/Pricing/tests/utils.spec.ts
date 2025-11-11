import { describe, test, expect } from 'vitest';
import { getMultipliedValue, getPriceRealValue } from '../utils';

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

describe('getPriceRealValue', () => {
  it('should divide by 1000000 when isTokenType is true', () => {
    expect(getPriceRealValue(2000000, true)).toBe('2');
    expect(getPriceRealValue('3000000', true)).toBe('3');
  });

  it('should return value as string when isTokenType is false', () => {
    expect(getPriceRealValue(42, false)).toBe('42');
    expect(getPriceRealValue('42', false)).toBe('42');
  });

  it('should return "0" when value is 0', () => {
    expect(getPriceRealValue(0, true)).toBe('0');
    expect(getPriceRealValue(0, false)).toBe('0');
  });

  it('should return undefined when value is undefined', () => {
    expect(getPriceRealValue(undefined, true)).toBeUndefined();
    expect(getPriceRealValue(undefined, false)).toBeUndefined();
  });

  it('should return undefined when value is null', () => {
    expect(getPriceRealValue(null as any, true)).toBeUndefined();
    expect(getPriceRealValue(null as any, false)).toBeUndefined();
  });
});
