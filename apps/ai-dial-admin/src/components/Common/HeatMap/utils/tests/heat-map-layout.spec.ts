import { Column, GridApi } from 'ag-grid-community';
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
  HEAT_MAP_HORIZONTAL_LAYOUT_MIN_WIDTH,
} from '@/src/components/Common/HeatMap/constants';
import {
  canFitHeatMapColumnsToContainer,
  buildEqualHeatMapColumnWidths,
  getHeatMapValueColumnWidth,
  measureVerticalHeatMapHeaderLabelHeight,
  resolveHeatMapHeaderHeight,
  resolveHeatMapLayoutWidth,
  resolveHeatMapRowHeight,
  shouldUseHeatMapHorizontalLayout,
} from '@/src/components/Common/HeatMap/utils/heat-map-layout';

const createApiMock = (columns: { colId: string; width: number }[]) =>
  ({
    getColumns: () => columns.map(({ colId, width }) => ({ getColId: () => colId, getActualWidth: () => width })),
  }) as unknown as GridApi;

describe('getHeatMapValueColumnWidth', () => {
  test('returns the narrowest value column so remainder-widened columns do not change the layout', () => {
    const api = createApiMock([
      { colId: 'heatMapLabel', width: 191 },
      { colId: 'tc_a', width: HEAT_MAP_HORIZONTAL_LAYOUT_MIN_WIDTH },
      { colId: 'tc_b', width: HEAT_MAP_HORIZONTAL_LAYOUT_MIN_WIDTH - 1 },
    ]);

    expect(getHeatMapValueColumnWidth(api)).toBe(HEAT_MAP_HORIZONTAL_LAYOUT_MIN_WIDTH - 1);
  });

  test('honors a custom column id prefix', () => {
    const api = createApiMock([
      { colId: 'tc_a', width: 10 },
      { colId: 'run_a', width: 30 },
    ]);

    expect(getHeatMapValueColumnWidth(api, 'run_')).toBe(30);
  });

  test('returns 0 when there are no value columns', () => {
    expect(getHeatMapValueColumnWidth(createApiMock([{ colId: 'heatMapLabel', width: 191 }]))).toBe(0);
  });
});

describe('resolveHeatMapLayoutWidth', () => {
  const column = { getActualWidth: () => 40 } as unknown as Column;

  test('prefers the layout width published on the grid context', () => {
    expect(resolveHeatMapLayoutWidth({ valueColumnLayoutWidth: 25 }, column)).toBe(25);
  });

  test('falls back to the column width without a published layout width', () => {
    expect(resolveHeatMapLayoutWidth({}, column)).toBe(40);
    expect(resolveHeatMapLayoutWidth(undefined, column)).toBe(40);
  });

  test('is undefined when neither a layout width nor a column is available', () => {
    expect(resolveHeatMapLayoutWidth(undefined, undefined)).toBeUndefined();
  });
});

describe('shouldUseHeatMapHorizontalLayout', () => {
  test('is true once the column is wide enough', () => {
    expect(shouldUseHeatMapHorizontalLayout(HEAT_MAP_HORIZONTAL_LAYOUT_MIN_WIDTH)).toBe(true);
    expect(shouldUseHeatMapHorizontalLayout(HEAT_MAP_HORIZONTAL_LAYOUT_MIN_WIDTH + 1)).toBe(true);
  });

  test('is false when the column is too narrow', () => {
    expect(shouldUseHeatMapHorizontalLayout(HEAT_MAP_HORIZONTAL_LAYOUT_MIN_WIDTH - 1)).toBe(false);
    expect(shouldUseHeatMapHorizontalLayout(20)).toBe(false);
  });
});

describe('resolveHeatMapRowHeight', () => {
  test('returns 40px when value columns are wide enough to show text', () => {
    expect(resolveHeatMapRowHeight(HEAT_MAP_HORIZONTAL_LAYOUT_MIN_WIDTH)).toBe(HEAT_MAP_GROUP_ROW_HEIGHT);
    expect(resolveHeatMapRowHeight(78)).toBe(HEAT_MAP_GROUP_ROW_HEIGHT);
  });

  test('returns 20px when value columns are too narrow (minified view)', () => {
    expect(resolveHeatMapRowHeight(HEAT_MAP_HORIZONTAL_LAYOUT_MIN_WIDTH - 1)).toBe(HEAT_MAP_ROW_HEIGHT);
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
    expect(resolveHeatMapHeaderHeight(HEAT_MAP_HORIZONTAL_LAYOUT_MIN_WIDTH)).toBe(HEAT_MAP_HEADER_HEIGHT_HORIZONTAL);
    expect(resolveHeatMapHeaderHeight(235)).toBe(HEAT_MAP_HEADER_HEIGHT_HORIZONTAL);
  });

  test('returns label-based height when value columns are too narrow for horizontal labels', () => {
    expect(resolveHeatMapHeaderHeight(HEAT_MAP_HORIZONTAL_LAYOUT_MIN_WIDTH - 1, ['Row 001'])).toBe(
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
    expect(resolveHeatMapHeaderHeight(HEAT_MAP_HORIZONTAL_LAYOUT_MIN_WIDTH - 1)).toBe(
      HEAT_MAP_HEADER_VERTICAL_MIN_HEIGHT,
    );
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
