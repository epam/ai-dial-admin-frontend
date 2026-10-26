import { describe, expect, test } from 'vitest';

import { TREND_TAG_PALETTE_DARK, TREND_TAG_PALETTE_LIGHT } from '@/src/components/TestSuites/Trends/constants';
import { getTrendTagPalette } from '@/src/components/TestSuites/Trends/MetricTrends/utils/trend-tag-palette';
import { EDITOR_THEMES } from '@/src/types/editor';

describe('getTrendTagPalette', () => {
  test('returns the dark palette for dark theme', () => {
    expect(getTrendTagPalette(EDITOR_THEMES.dark)).toBe(TREND_TAG_PALETTE_DARK);
  });

  test('returns the light palette for light theme', () => {
    expect(getTrendTagPalette(EDITOR_THEMES.light)).toBe(TREND_TAG_PALETTE_LIGHT);
  });
});
