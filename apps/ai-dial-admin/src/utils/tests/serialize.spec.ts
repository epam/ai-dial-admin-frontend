import { describe, expect, test } from 'vitest';

import { serializeValue } from '../serialize';

describe('Utils :: serializeValue', () => {
  test('Should return null for null', () => {
    expect(serializeValue(null)).toBeNull();
  });

  test('Should return null for undefined', () => {
    expect(serializeValue(undefined)).toBeNull();
  });

  test('Should return the string as-is for string input', () => {
    expect(serializeValue('hello')).toBe('hello');
  });

  test('Should return empty string for empty string input', () => {
    expect(serializeValue('')).toBe('');
  });

  test('Should return string of number for number input', () => {
    expect(serializeValue(42)).toBe('42');
    expect(serializeValue(0)).toBe('0');
    expect(serializeValue(-3.14)).toBe('-3.14');
  });

  test('Should return string of boolean for boolean input', () => {
    expect(serializeValue(true)).toBe('true');
    expect(serializeValue(false)).toBe('false');
  });

  test('Should return JSON.stringify with 2-space indent for object input', () => {
    const obj = { a: 1, b: 'two' };
    expect(serializeValue(obj)).toBe(JSON.stringify(obj, null, 2));
  });

  test('Should return JSON.stringify with 2-space indent for array input', () => {
    const arr = [1, 2, 3];
    expect(serializeValue(arr)).toBe(JSON.stringify(arr, null, 2));
  });

  test('Should return JSON.stringify with 2-space indent for nested object', () => {
    const nested = { a: { b: { c: 'deep' } } };
    expect(serializeValue(nested)).toBe(JSON.stringify(nested, null, 2));
  });
});
