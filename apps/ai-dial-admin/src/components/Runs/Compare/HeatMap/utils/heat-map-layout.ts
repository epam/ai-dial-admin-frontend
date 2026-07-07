import { GridApi } from 'ag-grid-community';

import { HEAT_MAP_GROUP_ROW_HEIGHT, HEAT_MAP_ROW_HEIGHT } from '@/src/components/Runs/Compare/HeatMap/constants';
import { shouldShowHeatMapCellValue } from '@/src/components/Runs/Compare/HeatMap/utils/format-heat-map-cell-value';

export const getHeatMapValueColumnWidth = (api: GridApi): number => {
  const valueColumn = (api.getColumns() ?? []).find((col) => col.getColId().startsWith('tc_'));
  return valueColumn?.getActualWidth() ?? 0;
};

export const resolveHeatMapRowHeight = (valueColumnWidth: number): number =>
  shouldShowHeatMapCellValue(valueColumnWidth) ? HEAT_MAP_GROUP_ROW_HEIGHT : HEAT_MAP_ROW_HEIGHT;
