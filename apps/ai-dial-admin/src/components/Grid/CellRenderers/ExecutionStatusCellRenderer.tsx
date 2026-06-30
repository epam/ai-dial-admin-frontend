'use client';

import { ICellRendererParams } from 'ag-grid-community';

import ExecutionStatusIcon from '@/src/components/Common/ExecutionStatusIcon/ExecutionStatusIcon';
import { AnalyticsResult, ExtractionResult } from '@/src/models/evaluation/run';

const ExecutionStatusCellRenderer = (params: ICellRendererParams) => {
  const status =
    (params.data as ExtractionResult)?.executionInfo?.status || (params.data as AnalyticsResult)?.executionStatus;
  if (!status) return null;

  return (
    <div className="flex items-center gap-2 py-1">
      <ExecutionStatusIcon status={status} />
    </div>
  );
};

export default ExecutionStatusCellRenderer;
