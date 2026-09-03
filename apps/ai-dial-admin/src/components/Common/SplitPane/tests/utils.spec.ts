import { describe, expect, test } from 'vitest';

import { MIN_SPLIT_PERCENT, SPLIT_STEP_PERCENT } from '@/src/components/Common/SplitPane/constants';
import { clampSplitPercent, stepSplitPercent } from '@/src/components/Common/SplitPane/utils';

describe('clampSplitPercent', () => {
  test('returns a request that is already inside the legal range', () => {
    expect(clampSplitPercent(62)).toBe(62);
  });

  test('raises a request below the floor to the floor', () => {
    expect(clampSplitPercent(3)).toBe(MIN_SPLIT_PERCENT);
  });

  test('lowers a request above the floor’s complement to that complement', () => {
    expect(clampSplitPercent(97)).toBe(100 - MIN_SPLIT_PERCENT);
  });

  test('leaves a request sitting exactly on either bound untouched', () => {
    expect(clampSplitPercent(MIN_SPLIT_PERCENT)).toBe(MIN_SPLIT_PERCENT);
    expect(clampSplitPercent(100 - MIN_SPLIT_PERCENT)).toBe(100 - MIN_SPLIT_PERCENT);
  });

  test('answers the two ends for a request past either of them', () => {
    expect(clampSplitPercent(0)).toBe(MIN_SPLIT_PERCENT);
    expect(clampSplitPercent(100)).toBe(100 - MIN_SPLIT_PERCENT);
  });

  test('honours a caller’s own floor', () => {
    expect(clampSplitPercent(10, 30)).toBe(30);
    expect(clampSplitPercent(90, 30)).toBe(70);
  });

  test('caps a floor above the midpoint rather than inverting the range', () => {
    // A floor of 60 leaves no legal range, so it is capped at the midpoint — never answered as 40, which
    // would be below the floor the caller asked for.
    expect(clampSplitPercent(50, 60)).toBe(50);
    expect(clampSplitPercent(10, 60)).toBe(50);
    expect(clampSplitPercent(90, 60)).toBe(50);
  });

  test('resolves a measurement that produced no number to the midpoint', () => {
    expect(clampSplitPercent(Number.NaN)).toBe(50);
    expect(clampSplitPercent(Number.POSITIVE_INFINITY)).toBe(50);
  });
});

describe('stepSplitPercent', () => {
  test('moves the split by the requested delta', () => {
    expect(stepSplitPercent(50, SPLIT_STEP_PERCENT)).toBe(50 + SPLIT_STEP_PERCENT);
    expect(stepSplitPercent(50, -SPLIT_STEP_PERCENT)).toBe(50 - SPLIT_STEP_PERCENT);
  });

  test('stops at the floor rather than crossing it', () => {
    expect(stepSplitPercent(MIN_SPLIT_PERCENT + 2, -SPLIT_STEP_PERCENT)).toBe(MIN_SPLIT_PERCENT);
  });

  test('stops at the floor’s complement rather than crossing it', () => {
    expect(stepSplitPercent(100 - MIN_SPLIT_PERCENT - 2, SPLIT_STEP_PERCENT)).toBe(100 - MIN_SPLIT_PERCENT);
  });

  test('answers the bound it already sits on when stepped further', () => {
    expect(stepSplitPercent(MIN_SPLIT_PERCENT, -SPLIT_STEP_PERCENT)).toBe(MIN_SPLIT_PERCENT);
  });
});
