'use client';

import { ICellRendererParams } from 'ag-grid-community';
import { FC } from 'react';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

import { HeatMapGridRow } from '@/src/components/Common/HeatMap/models';

/** Figma node 11012:99503 — run label cell uses 12px horizontal padding (`p-[12px]` / `px-3`). */
const HeatMapLabelCellRenderer: FC<ICellRendererParams<HeatMapGridRow>> = ({ data }) => {
  if (!data) {
    return null;
  }

  return (
    <div className="flex items-center h-full min-w-0 px-3 text-primary dial-small-text">
      <DialEllipsisTooltip text={data.label} contentClassName="truncate" className="min-w-0 flex-1" />
    </div>
  );
};

export default HeatMapLabelCellRenderer;
