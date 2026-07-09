'use client';

import { ICellRendererParams } from 'ag-grid-community';
import { FC } from 'react';

import { HeatMapColorDisplayMode, HeatMapRow, HeatMapRowType } from '@/src/components/Runs/Compare/HeatMap/models';
import {
  formatHeatMapCellValueForMode,
  shouldShowHeatMapCellValue,
} from '@/src/components/Runs/Compare/HeatMap/utils/format-heat-map-cell-value';

interface Props extends ICellRendererParams<HeatMapRow> {
  colorDisplayMode?: HeatMapColorDisplayMode;
}

const HeatMapValueCellRenderer: FC<Props> = ({ data, column, colorDisplayMode = HeatMapColorDisplayMode.Absolute }) => {
  if (!data || data.rowType === HeatMapRowType.Group) {
    return null;
  }

  const columnWidth = column?.getActualWidth() ?? 0;
  if (!shouldShowHeatMapCellValue(columnWidth)) {
    return null;
  }

  const colId = column?.getColId() ?? '';
  const rawValue = colId ? data.values[colId] : undefined;
  const isDeltaMode = colorDisplayMode === HeatMapColorDisplayMode.Delta;
  const displayValue = formatHeatMapCellValueForMode(rawValue, isDeltaMode);
  const isMissing = rawValue === undefined;
  const isSecondaryText = isMissing || (isDeltaMode && rawValue === 0);

  return (
    <div className="flex items-center justify-center size-full overflow-hidden px-1">
      <span
        className={
          isSecondaryText ? 'dial-small-text text-secondary truncate' : 'dial-small-text text-primary truncate'
        }
      >
        {displayValue}
      </span>
    </div>
  );
};

export default HeatMapValueCellRenderer;
