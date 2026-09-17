'use client';

import { ICellRendererParams } from 'ag-grid-community';
import { FC } from 'react';

import CommonHeatMapValueCellRenderer from '@/src/components/Common/HeatMap/HeatMapValueCellRenderer';
import { HeatMapValueFormatMode } from '@/src/components/Common/HeatMap/models';
import { HeatMapColorDisplayMode, HeatMapRow } from '@/src/components/Runs/Compare/HeatMap/models';

interface Props extends ICellRendererParams<HeatMapRow> {
  colorDisplayMode?: HeatMapColorDisplayMode;
}

const HeatMapValueCellRenderer: FC<Props> = ({ colorDisplayMode = HeatMapColorDisplayMode.Absolute, ...params }) => (
  <CommonHeatMapValueCellRenderer
    {...(params as unknown as ICellRendererParams<{ values: HeatMapRow['values']; isGroup?: boolean }>)}
    formatMode={
      colorDisplayMode === HeatMapColorDisplayMode.Delta
        ? HeatMapValueFormatMode.Delta
        : HeatMapValueFormatMode.Absolute
    }
  />
);

export default HeatMapValueCellRenderer;
