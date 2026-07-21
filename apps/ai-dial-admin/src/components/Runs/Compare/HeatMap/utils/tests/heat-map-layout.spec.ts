import { describe, expect, test } from 'vitest';

import {
  HEAT_MAP_GROUP_ROW_HEIGHT,
  HEAT_MAP_HEADER_HEIGHT_HORIZONTAL,
  HEAT_MAP_HEADER_LABEL_VERTICAL_PADDING,
  HEAT_MAP_HEADER_VERTICAL_CHAR_WIDTH,
  HEAT_MAP_HEADER_VERTICAL_LABEL_OVERFLOW_BUFFER,
  HEAT_MAP_HEADER_VERTICAL_MIN_HEIGHT,
  HEAT_MAP_ROW_HEIGHT,
  HEAT_MAP_VALUE_COL_MIN_WIDTH,
  HEAT_MAP_VALUE_TEXT_MIN_WIDTH,
} from '@/src/components/Runs/Compare/HeatMap/constants';
import {
  canFitHeatMapColumnsToContainer,
  buildEqualHeatMapColumnWidths,
  measureVerticalHeatMapHeaderLabelHeight,
  resolveHeatMapHeaderHeight,
  resolveHeatMapRowHeight,
} from '@/src/components/Runs/Compare/HeatMap/utils/heat-map-layout';

describe('resolveHeatMapRowHeight', () => {
  test('returns 40px when value columns are wide enough to show text', () => {
    expect(resolveHeatMapRowHeight(HEAT_MAP_VALUE_TEXT_MIN_WIDTH)).toBe(HEAT_MAP_GROUP_ROW_HEIGHT);
    expect(resolveHeatMapRowHeight(78)).toBe(HEAT_MAP_GROUP_ROW_HEIGHT);
  });

  test('returns 20px when value columns are too narrow (minified view)', () => {
    expect(resolveHeatMapRowHeight(HEAT_MAP_VALUE_TEXT_MIN_WIDTH - 1)).toBe(HEAT_MAP_ROW_HEIGHT);
    expect(resolveHeatMapRowHeight(14)).toBe(HEAT_MAP_ROW_HEIGHT);
  });
});

describe('measureVerticalHeatMapHeaderLabelHeight', () => {
  test('estimates height from label length with overflow buffer', () => {
    expect(measureVerticalHeatMapHeaderLabelHeight('Row 001')).toBe(
      7 * HEAT_MAP_HEADER_VERTICAL_CHAR_WIDTH + HEAT_MAP_HEADER_VERTICAL_LABEL_OVERFLOW_BUFFER,
    );
    expect(measureVerticalHeatMapHeaderLabelHeight('')).toBe(HEAT_MAP_HEADER_VERTICAL_LABEL_OVERFLOW_BUFFER);
  });
});

describe('resolveHeatMapHeaderHeight', () => {
  test('returns compact height when value columns are wide enough for horizontal labels', () => {
    expect(resolveHeatMapHeaderHeight(HEAT_MAP_VALUE_TEXT_MIN_WIDTH)).toBe(HEAT_MAP_HEADER_HEIGHT_HORIZONTAL);
    expect(resolveHeatMapHeaderHeight(235)).toBe(HEAT_MAP_HEADER_HEIGHT_HORIZONTAL);
  });

  test('returns label-based height when value columns are too narrow for horizontal labels', () => {
    expect(resolveHeatMapHeaderHeight(HEAT_MAP_VALUE_TEXT_MIN_WIDTH - 1, ['Row 001'])).toBe(
      7 * HEAT_MAP_HEADER_VERTICAL_CHAR_WIDTH +
        HEAT_MAP_HEADER_VERTICAL_LABEL_OVERFLOW_BUFFER +
        HEAT_MAP_HEADER_LABEL_VERTICAL_PADDING,
    );
    expect(resolveHeatMapHeaderHeight(14, ['A', 'Longer label'])).toBe(
      'Longer label'.length * HEAT_MAP_HEADER_VERTICAL_CHAR_WIDTH +
        HEAT_MAP_HEADER_VERTICAL_LABEL_OVERFLOW_BUFFER +
        HEAT_MAP_HEADER_LABEL_VERTICAL_PADDING,
    );
  });

  test('returns min height when no labels are provided in vertical mode', () => {
    expect(resolveHeatMapHeaderHeight(HEAT_MAP_VALUE_TEXT_MIN_WIDTH - 1)).toBe(HEAT_MAP_HEADER_VERTICAL_MIN_HEIGHT);
    expect(resolveHeatMapHeaderHeight(14, [])).toBe(HEAT_MAP_HEADER_VERTICAL_MIN_HEIGHT);
  });
});

describe('canFitHeatMapColumnsToContainer', () => {
  test('returns true when available width can fit all columns at min width', () => {
    expect(canFitHeatMapColumnsToContainer(HEAT_MAP_VALUE_COL_MIN_WIDTH * 10, 10)).toBe(true);
    expect(canFitHeatMapColumnsToContainer(HEAT_MAP_VALUE_COL_MIN_WIDTH * 10 + 5, 10)).toBe(true);
  });

  test('returns false when columns would be squeezed below min width', () => {
    expect(canFitHeatMapColumnsToContainer(HEAT_MAP_VALUE_COL_MIN_WIDTH * 10 - 1, 10)).toBe(false);
    expect(canFitHeatMapColumnsToContainer(0, 84)).toBe(false);
  });

  test('returns false for empty column count', () => {
    expect(canFitHeatMapColumnsToContainer(1000, 0)).toBe(false);
  });
});

describe('buildEqualHeatMapColumnWidths', () => {
  test('returns empty array for empty column count', () => {
    expect(buildEqualHeatMapColumnWidths(1000, 0)).toEqual([]);
  });

  test('distributes available width evenly with remainder on leading columns', () => {
    // 1153 / 53 = 21 remainder 40 → first 40 columns are 22, rest are 21
    expect(buildEqualHeatMapColumnWidths(1153, 53)).toEqual([...Array(40).fill(22), ...Array(13).fill(21)]);
  });

  test('never goes below min width', () => {
    expect(buildEqualHeatMapColumnWidths(0, 5)).toEqual(Array(5).fill(HEAT_MAP_VALUE_COL_MIN_WIDTH));
  });
});
