import { describe, expect, test } from 'vitest';

import { getBarHeightPercent, MIN_BAR_HEIGHT_PERCENT } from '@/src/components/EvalSystemHealth/utils/get-bar-height';

describe('getBarHeightPercent', () => {
  test('scales a pass rate to a percentage of the chart', () => {
    expect(getBarHeightPercent(0.5)).toBe(50);
    expect(getBarHeightPercent(1)).toBe(100);
  });

  test('keeps a rate of zero visible with a minimum height', () => {
    expect(getBarHeightPercent(0)).toBe(MIN_BAR_HEIGHT_PERCENT);
  });

  test('raises a rate just above zero to the minimum', () => {
    expect(getBarHeightPercent(0.01)).toBe(MIN_BAR_HEIGHT_PERCENT);
  });

  test('caps a rate above 1 at the full chart height', () => {
    expect(getBarHeightPercent(1.2)).toBe(100);
  });
});
