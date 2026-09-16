import { Column, GridApi } from 'ag-grid-community';

import {
  HEAT_MAP_GROUP_ROW_HEIGHT,
  HEAT_MAP_HEADER_HEIGHT_HORIZONTAL,
  HEAT_MAP_HEADER_LABEL_VERTICAL_PADDING,
  HEAT_MAP_HEADER_VERTICAL_CHAR_WIDTH,
  HEAT_MAP_HEADER_VERTICAL_LABEL_OVERFLOW_BUFFER,
  HEAT_MAP_HEADER_VERTICAL_MIN_HEIGHT,
  HEAT_MAP_HEADER_VERTICAL_MAX_HEIGHT,
  HEAT_MAP_ROW_HEIGHT,
  HEAT_MAP_VALUE_COL_MIN_WIDTH,
  HEAT_MAP_VALUE_COL_PREFIX_TEST_CASE,
} from '@/src/components/Common/HeatMap/constants';
import { shouldShowHeatMapCellValue } from '@/src/components/Common/HeatMap/utils/format-heat-map-cell-value';

export const measureVerticalHeatMapHeaderLabelHeight = (label: string): number =>
  label.length * HEAT_MAP_HEADER_VERTICAL_CHAR_WIDTH + HEAT_MAP_HEADER_VERTICAL_LABEL_OVERFLOW_BUFFER;

export const getHeatMapValueColumns = (
  api: GridApi,
  valueColumnIdPrefix: string = HEAT_MAP_VALUE_COL_PREFIX_TEST_CASE,
): Column[] => (api.getColumns() ?? []).filter((col) => col.getColId().startsWith(valueColumnIdPrefix));

export const getHeatMapValueColumnWidth = (
  api: GridApi,
  valueColumnIdPrefix: string = HEAT_MAP_VALUE_COL_PREFIX_TEST_CASE,
): number => {
  const valueColumn = getHeatMapValueColumns(api, valueColumnIdPrefix)[0];
  return valueColumn?.getActualWidth() ?? 0;
};

/** @deprecated Prefer getHeatMapValueColumns — kept for Compare call-site clarity. */
export const getHeatMapTestCaseColumns = (api: GridApi): Column[] =>
  getHeatMapValueColumns(api, HEAT_MAP_VALUE_COL_PREFIX_TEST_CASE);

export const canFitHeatMapColumnsToContainer = (availableWidth: number, columnCount: number): boolean =>
  columnCount > 0 && availableWidth >= columnCount * HEAT_MAP_VALUE_COL_MIN_WIDTH;

/** Equal widths for value columns; remainder pixels go to the first columns (+1 each). */
export const buildEqualHeatMapColumnWidths = (availableWidth: number, columnCount: number): number[] => {
  if (columnCount <= 0) {
    return [];
  }

  const baseWidth = Math.max(HEAT_MAP_VALUE_COL_MIN_WIDTH, Math.floor(availableWidth / columnCount));
  const remainder = Math.max(0, availableWidth - baseWidth * columnCount);

  return Array.from({ length: columnCount }, (_, index) => baseWidth + (index < remainder ? 1 : 0));
};

export const applyHeatMapColumnWidths = (
  api: GridApi,
  availableForValueColumns: number,
  valueColumnIdPrefix: string = HEAT_MAP_VALUE_COL_PREFIX_TEST_CASE,
): void => {
  const valueColumns = getHeatMapValueColumns(api, valueColumnIdPrefix);
  if (!valueColumns.length) {
    return;
  }

  const canFit = canFitHeatMapColumnsToContainer(availableForValueColumns, valueColumns.length);

  // Prefer applyColumnState over setColumnWidths — ColumnResizeModule is not registered app-wide.
  // Avoid sizeColumnsToFit: it can leave the first value column at minWidth while others grow.
  const widths = canFit
    ? buildEqualHeatMapColumnWidths(availableForValueColumns, valueColumns.length)
    : valueColumns.map(() => HEAT_MAP_VALUE_COL_MIN_WIDTH);

  api.applyColumnState({
    state: valueColumns.map((col, index) => ({
      colId: col.getColId(),
      width: widths[index],
      flex: null,
    })),
  });
  api.setGridOption('alwaysShowHorizontalScroll', !canFit);
};

export const resolveHeatMapRowHeight = (valueColumnWidth: number): number =>
  shouldShowHeatMapCellValue(valueColumnWidth) ? HEAT_MAP_GROUP_ROW_HEIGHT : HEAT_MAP_ROW_HEIGHT;

export const resolveHeatMapHeaderHeight = (valueColumnWidth: number, headerLabels: string[] = []): number => {
  if (shouldShowHeatMapCellValue(valueColumnWidth)) {
    return HEAT_MAP_HEADER_HEIGHT_HORIZONTAL;
  }

  const maxLabelHeight = headerLabels.reduce(
    (max, label) => Math.max(max, measureVerticalHeatMapHeaderLabelHeight(label)),
    0,
  );

  return Math.max(
    HEAT_MAP_HEADER_VERTICAL_MIN_HEIGHT,
    Math.min(maxLabelHeight + HEAT_MAP_HEADER_LABEL_VERTICAL_PADDING, HEAT_MAP_HEADER_VERTICAL_MAX_HEIGHT),
  );
};
