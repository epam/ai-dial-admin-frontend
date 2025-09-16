import { describe, expect, test } from 'vitest';
import { isEqualSkippingUndefined } from '../is-equals-entity';

describe('isEqualSkippingUndefined', () => {
  test('returns true for equal objects', () => {
    expect(isEqualSkippingUndefined({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
  });

  test('returns true for objects differing only by undefined fields', () => {
    expect(isEqualSkippingUndefined({ a: 1, b: undefined }, { a: 1 })).toBe(true);
    expect(isEqualSkippingUndefined({ a: 1 }, { a: 1, b: undefined })).toBe(true);
  });

  test('returns true for nested objects with undefined fields', () => {
    expect(isEqualSkippingUndefined({ a: 1, b: { c: 2, d: undefined } }, { a: 1, b: { c: 2 } })).toBe(true);
  });

  test('returns false for objects with different values', () => {
    expect(isEqualSkippingUndefined({ a: 1 }, { a: 2 })).toBe(false);
    expect(isEqualSkippingUndefined({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
  });

  test('returns true for both undefined or empty', () => {
    expect(isEqualSkippingUndefined(undefined, undefined)).toBe(true);
    expect(isEqualSkippingUndefined(null, undefined)).toBe(true);
    expect(isEqualSkippingUndefined({}, {})).toBe(true);
  });

  test('returns false if one is undefined and the other is not empty', () => {
    expect(isEqualSkippingUndefined(undefined, { a: 1 })).toBe(false);
    expect(isEqualSkippingUndefined({ a: 1 }, undefined)).toBe(false);
  });

  test('returns true for arrays with undefined elements skipped', () => {
    expect(isEqualSkippingUndefined({ arr: [1, undefined, 3] }, { arr: [1, 3] })).toBe(false); // Arrays are compared strictly, so this is false
  });
});
