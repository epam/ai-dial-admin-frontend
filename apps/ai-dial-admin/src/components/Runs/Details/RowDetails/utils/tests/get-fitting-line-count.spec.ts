import { describe, expect, test } from 'vitest';

import { getFittingLineCount } from '@/src/components/Runs/Details/RowDetails/utils/get-fitting-line-count';

describe('getFittingLineCount', () => {
  test('returns the whole lines that fit', () => {
    expect(getFittingLineCount(100, 20)).toBe(5);
  });

  test('rounds down a partial line', () => {
    expect(getFittingLineCount(99, 20)).toBe(4);
  });

  test('returns exactly one line when the height equals the line height', () => {
    expect(getFittingLineCount(20, 20)).toBe(1);
  });

  test('never returns fewer than one line for a height smaller than a line', () => {
    expect(getFittingLineCount(7, 20)).toBe(1);
  });

  test('returns undefined while the height is unknown', () => {
    expect(getFittingLineCount(0, 20)).toBeUndefined();
    expect(getFittingLineCount(-5, 20)).toBeUndefined();
    expect(getFittingLineCount(Number.NaN, 20)).toBeUndefined();
  });

  test('returns undefined for a line height that cannot be used', () => {
    expect(getFittingLineCount(100, 0)).toBeUndefined();
    expect(getFittingLineCount(100, Number.NaN)).toBeUndefined();
  });
});
