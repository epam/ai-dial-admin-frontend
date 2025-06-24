'use client';
import { ICellRendererParams } from 'ag-grid-community';

export interface StatusCellRendererParams extends ICellRendererParams {
  statusClass?: string;
}

const StatusCellRenderer = (params: StatusCellRendererParams) => {
  return (
    <div className="flex items-center gap-2 py-3 px-2">
      <div className={`w-[10px] h-[10px] rounded-full ${params.statusClass}`}></div>
      <div>{params.value}</div>
    </div>
  );
};

export default StatusCellRenderer;
