import { GridApi } from 'ag-grid-community';

import {
  HEAT_MAP_GROUP_ROW_HEIGHT,
  HEAT_MAP_HEADER_HEIGHT_HORIZONTAL,
  HEAT_MAP_HEADER_LABEL_VERTICAL_PADDING,
  HEAT_MAP_HEADER_VERTICAL_CHAR_WIDTH,
  HEAT_MAP_HEADER_VERTICAL_LABEL_OVERFLOW_BUFFER,
  HEAT_MAP_HEADER_VERTICAL_MIN_HEIGHT,
  HEAT_MAP_ROW_HEIGHT,
} from '@/src/components/Runs/Compare/HeatMap/constants';
import { shouldShowHeatMapCellValue } from '@/src/components/Runs/Compare/HeatMap/utils/format-heat-map-cell-value';

export const measureVerticalHeatMapHeaderLabelHeight = (label: string): number =>
  label.length * HEAT_MAP_HEADER_VERTICAL_CHAR_WIDTH + HEAT_MAP_HEADER_VERTICAL_LABEL_OVERFLOW_BUFFER;

export const getHeatMapValueColumnWidth = (api: GridApi): number => {
  const valueColumn = (api.getColumns() ?? []).find((col) => col.getColId().startsWith('tc_'));
  return valueColumn?.getActualWidth() ?? 0;
};

export const resolveHeatMapRowHeight = (valueColumnWidth: number, isDeltaMode = false): number => {
  if (isDeltaMode) {
    return HEAT_MAP_GROUP_ROW_HEIGHT;
  }

  return shouldShowHeatMapCellValue(valueColumnWidth) ? HEAT_MAP_GROUP_ROW_HEIGHT : HEAT_MAP_ROW_HEIGHT;
};

export const resolveHeatMapHeaderHeight = (valueColumnWidth: number, headerLabels: string[] = []): number => {
  if (shouldShowHeatMapCellValue(valueColumnWidth)) {
    return HEAT_MAP_HEADER_HEIGHT_HORIZONTAL;
  }

  const maxLabelHeight = headerLabels.reduce(
    (max, label) => Math.max(max, measureVerticalHeatMapHeaderLabelHeight(label)),
    0,
  );

  return Math.max(HEAT_MAP_HEADER_VERTICAL_MIN_HEIGHT, maxLabelHeight + HEAT_MAP_HEADER_LABEL_VERTICAL_PADDING);
};
