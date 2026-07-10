import { describe, expect, test } from 'vitest';

import { HEAT_MAP_VALUE_TEXT_MIN_WIDTH } from '@/src/components/Runs/Compare/HeatMap/constants';
import {
  formatHeatMapCellValue,
  formatHeatMapCellValueForMode,
  formatHeatMapDeltaCellValue,
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
