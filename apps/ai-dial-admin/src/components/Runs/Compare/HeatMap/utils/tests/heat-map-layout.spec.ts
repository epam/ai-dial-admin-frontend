import { describe, expect, test } from 'vitest';

import {
  HEAT_MAP_GROUP_ROW_HEIGHT,
  HEAT_MAP_HEADER_HEIGHT_HORIZONTAL,
  HEAT_MAP_HEADER_LABEL_VERTICAL_PADDING,
  HEAT_MAP_HEADER_VERTICAL_CHAR_WIDTH,
  HEAT_MAP_HEADER_VERTICAL_LABEL_OVERFLOW_BUFFER,
  HEAT_MAP_HEADER_VERTICAL_MIN_HEIGHT,
  HEAT_MAP_ROW_HEIGHT,
  HEAT_MAP_VALUE_TEXT_MIN_WIDTH,
} from '@/src/components/Runs/Compare/HeatMap/constants';
import {
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

  test('returns 40px in delta mode regardless of column width', () => {
    expect(resolveHeatMapRowHeight(14, true)).toBe(HEAT_MAP_GROUP_ROW_HEIGHT);
    expect(resolveHeatMapRowHeight(HEAT_MAP_VALUE_TEXT_MIN_WIDTH, true)).toBe(HEAT_MAP_GROUP_ROW_HEIGHT);
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
