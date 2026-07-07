'use client';

import { ICellRendererParams } from 'ag-grid-community';
import { FC } from 'react';

import { HeatMapRow, HeatMapRowType } from '@/src/components/Runs/Compare/HeatMap/models';
import {
  formatHeatMapCellValue,
  shouldShowHeatMapCellValue,
} from '@/src/components/Runs/Compare/HeatMap/utils/format-heat-map-cell-value';

const HeatMapValueCellRenderer: FC<ICellRendererParams<HeatMapRow>> = ({ data, column }) => {
  if (!data || data.rowType === HeatMapRowType.Group) {
    return null;
  }

  const columnWidth = column?.getActualWidth() ?? 0;
  if (!shouldShowHeatMapCellValue(columnWidth)) {
    return null;
  }

  const colId = column?.getColId() ?? '';
  const rawValue = colId ? data.values[colId] : undefined;
  const displayValue = rawValue === undefined ? '—' : formatHeatMapCellValue(rawValue);

  return (
    <div className="flex items-center justify-center size-full overflow-hidden px-1">
      <span className="dial-small-text text-primary truncate">{displayValue}</span>
    </div>
  );
};

export default HeatMapValueCellRenderer;
