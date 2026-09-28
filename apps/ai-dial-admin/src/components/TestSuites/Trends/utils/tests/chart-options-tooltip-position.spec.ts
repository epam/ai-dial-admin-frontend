import { describe, expect, test } from 'vitest';

import {
  resolveCategoryDataIndexFromLayout,
  resolveCategoryDataIndexFromPixel,
  resolveOverallScoreTooltipPosition,
} from '@/src/components/TestSuites/Trends/utils/chart-options';

describe('resolveOverallScoreTooltipPosition', () => {
  test('places tooltip above the pointer when there is room', () => {
    expect(
      resolveOverallScoreTooltipPosition([100, 120], {
        contentSize: [140, 80],
        viewSize: [800, 220],
      }),
    ).toEqual([112, 28]);
  });

  test('falls back below when above would clip the top', () => {
    expect(
      resolveOverallScoreTooltipPosition([100, 20], {
        contentSize: [140, 80],
        viewSize: [800, 220],
      }),
    ).toEqual([112, 32]);
  });

  test('flips left when the tooltip would overflow the right edge', () => {
    expect(
      resolveOverallScoreTooltipPosition([780, 100], {
        contentSize: [140, 80],
        viewSize: [800, 220],
      }),
    ).toEqual([628, 8]);
  });
});

describe('resolveCategoryDataIndexFromLayout', () => {
  test('maps x across the plot with boundaryGap false', () => {
    // plot: 48 .. 48+900=948 for width 964 (48+900+16)
    expect(resolveCategoryDataIndexFromLayout(48, 964, 10)).toBe(0);
    expect(resolveCategoryDataIndexFromLayout(948, 964, 10)).toBe(9);
    expect(resolveCategoryDataIndexFromLayout(498, 964, 10)).toBe(5);
  });
});

describe('resolveCategoryDataIndexFromPixel', () => {
  test('uses grid conversion when available', () => {
    const convert = (finder: unknown) => (finder === 'grid' ? [2.4, 0.1] : null);
    expect(resolveCategoryDataIndexFromPixel(convert, 10, 20, 10)).toBe(2);
  });

  test('falls back to layout when convertFromPixel fails', () => {
    const convert = () => null;
    expect(resolveCategoryDataIndexFromPixel(convert, 498, 194, 10, 964, 220)).toBe(5);
  });

  test('returns null when conversion and layout both fail', () => {
    const convert = () => null;
    expect(resolveCategoryDataIndexFromPixel(convert, 10, 20, 10)).toBeNull();
  });
});
