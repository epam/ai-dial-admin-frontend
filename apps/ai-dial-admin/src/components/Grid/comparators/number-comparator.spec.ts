import { numberValueComparator } from './number-comparator';
import { describe, expect, test } from 'vitest';

describe('numberValueComparator', () => {
  test('returns 0 if numbers are equal', () => {
    expect(numberValueComparator(5, 5, {} as any, {} as any, false)).toBe(0);
    expect(numberValueComparator('10', 10, {} as any, {} as any, false)).toBe(0);
    expect(numberValueComparator('7', '7', {} as any, {} as any, false)).toBe(0);
  });

  test('returns 1 if a is undefined and b is defined (not inverted)', () => {
    expect(numberValueComparator(void 0, 2, {} as any, {} as any, false)).toBe(1);
  });

  test('returns -1 if a is undefined and b is defined (inverted)', () => {
    expect(numberValueComparator(void 0, 2, {} as any, {} as any, true)).toBe(-1);
  });

  test('returns -1 if b is undefined and a is defined (not inverted)', () => {
    expect(numberValueComparator(2, void 0, {} as any, {} as any, false)).toBe(-1);
  });

  test('returns 1 if b is undefined and a is defined (inverted)', () => {
    expect(numberValueComparator(2, void 0, {} as any, {} as any, true)).toBe(1);
  });

  test('returns 1 if a > b', () => {
    expect(numberValueComparator(10, 5, {} as any, {} as any, false)).toBe(1);
    expect(numberValueComparator('20', 5, {} as any, {} as any, false)).toBe(1);
  });

  test('returns -1 if a < b', () => {
    expect(numberValueComparator(3, 7, {} as any, {} as any, false)).toBe(-1);
    expect(numberValueComparator('2', '10', {} as any, {} as any, false)).toBe(-1);
  });

  test('handles string numbers correctly', () => {
    expect(numberValueComparator('100', '99', {} as any, {} as any, false)).toBe(1);
    expect(numberValueComparator('1', '2', {} as any, {} as any, false)).toBe(-1);
  });
});
