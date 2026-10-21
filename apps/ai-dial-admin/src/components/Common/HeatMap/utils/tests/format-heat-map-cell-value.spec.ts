import { describe, expect, test } from 'vitest';

import { HEAT_MAP_VALUE_TIERS } from '@/src/components/Common/HeatMap/constants';
import {
  formatHeatMapCellValue,
  formatHeatMapCellValueForMode,
  formatHeatMapDeltaCellValue,
  resolveHeatMapValueTier,
} from '@/src/components/Common/HeatMap/utils/format-heat-map-cell-value';

describe('formatHeatMapCellValue', () => {
  test('formats numeric values to three decimals', () => {
    expect(formatHeatMapCellValue(0.5)).toBe('0.500');
    expect(formatHeatMapCellValue(0.812)).toBe('0.812');
  });

  test('returns em dash for nullish values', () => {
    expect(formatHeatMapCellValue(null)).toBe('—');
    expect(formatHeatMapCellValue(undefined)).toBe('—');
  });
});

describe('formatHeatMapDeltaCellValue', () => {
  test('formats signed delta values', () => {
    expect(formatHeatMapDeltaCellValue(0.303)).toBe('+0.303');
    expect(formatHeatMapDeltaCellValue(-0.898)).toBe('-0.898');
    expect(formatHeatMapDeltaCellValue(0)).toBe('0');
  });
});

describe('formatHeatMapCellValueForMode', () => {
  test('uses delta formatting in delta mode', () => {
    expect(formatHeatMapCellValueForMode(0.3, true)).toBe('+0.300');
    expect(formatHeatMapCellValueForMode(0.3, false)).toBe('0.300');
    expect(formatHeatMapCellValueForMode(null, true)).toBe('—');
  });
});

describe('resolveHeatMapValueTier', () => {
  const [defaultTier, mediumTier, smallTier] = HEAT_MAP_VALUE_TIERS;

  test.each([
    { isDeltaMode: false, minWidth: (t: typeof defaultTier) => t.minWidthAbsolute },
    { isDeltaMode: true, minWidth: (t: typeof defaultTier) => t.minWidthDelta },
  ])('steps down at each tier boundary (isDeltaMode: $isDeltaMode)', ({ isDeltaMode, minWidth }) => {
    expect(resolveHeatMapValueTier(minWidth(defaultTier), isDeltaMode)).toBe(defaultTier);
    expect(resolveHeatMapValueTier(minWidth(defaultTier) - 1, isDeltaMode)).toBe(mediumTier);
    expect(resolveHeatMapValueTier(minWidth(mediumTier), isDeltaMode)).toBe(mediumTier);
    expect(resolveHeatMapValueTier(minWidth(mediumTier) - 1, isDeltaMode)).toBe(smallTier);
    expect(resolveHeatMapValueTier(minWidth(smallTier), isDeltaMode)).toBe(smallTier);
    expect(resolveHeatMapValueTier(minWidth(smallTier) - 1, isDeltaMode)).toBeNull();
  });

  test('returns the default tier for any wider column', () => {
    expect(resolveHeatMapValueTier(500, false)).toBe(defaultTier);
  });

  test('returns null for the minimum column width', () => {
    expect(resolveHeatMapValueTier(14, false)).toBeNull();
  });

  test('delta mode needs more width than absolute mode for the same tier', () => {
    expect(resolveHeatMapValueTier(defaultTier.minWidthAbsolute, false)).toBe(defaultTier);
    expect(resolveHeatMapValueTier(defaultTier.minWidthAbsolute, true)).toBe(mediumTier);
  });

  test('tiers are ordered from the largest text to the smallest', () => {
    HEAT_MAP_VALUE_TIERS.slice(1).forEach((tier, index) => {
      expect(tier.minWidthAbsolute).toBeLessThan(HEAT_MAP_VALUE_TIERS[index].minWidthAbsolute);
      expect(tier.minWidthDelta).toBeLessThan(HEAT_MAP_VALUE_TIERS[index].minWidthDelta);
    });
  });
});
