import { describe, expect, test } from 'vitest';

import { HEAT_MAP_VALUE_TEXT_MIN_WIDTH } from '@/src/components/Runs/Compare/HeatMap/constants';
import {
  formatHeatMapCellValue,
  shouldShowHeatMapCellValue,
} from '@/src/components/Runs/Compare/HeatMap/utils/format-heat-map-cell-value';

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

describe('shouldShowHeatMapCellValue', () => {
  test('shows value text when column is wide enough', () => {
    expect(shouldShowHeatMapCellValue(HEAT_MAP_VALUE_TEXT_MIN_WIDTH)).toBe(true);
    expect(shouldShowHeatMapCellValue(HEAT_MAP_VALUE_TEXT_MIN_WIDTH + 1)).toBe(true);
  });

  test('hides value text when column is too narrow', () => {
    expect(shouldShowHeatMapCellValue(HEAT_MAP_VALUE_TEXT_MIN_WIDTH - 1)).toBe(false);
    expect(shouldShowHeatMapCellValue(20)).toBe(false);
  });
});
