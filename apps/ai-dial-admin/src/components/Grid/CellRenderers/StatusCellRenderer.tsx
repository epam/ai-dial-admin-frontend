'use client';
import { ICellRendererParams } from 'ag-grid-community';

export interface StatusCellRendererParams extends ICellRendererParams {
  statusClassName?: string;
}

const StatusCellRenderer = (params: StatusCellRendererParams) => {
  return (
    <div className="flex items-center gap-2 py-3 px-2">
      <div className={`w-[10px] h-[10px] rounded-full ${params.statusClassName}`}></div>
      <div>{params.value}</div>
    </div>
  );
};

export default StatusCellRenderer;
