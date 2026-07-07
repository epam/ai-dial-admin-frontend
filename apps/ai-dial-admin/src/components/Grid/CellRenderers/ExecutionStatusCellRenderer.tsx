'use client';

import { ICellRendererParams } from 'ag-grid-community';

import ExecutionStatusIcon from '@/src/components/Common/ExecutionStatusIcon/ExecutionStatusIcon';
import { AnalyticsResult, ExtractionResult, ExtractionResultStatus } from '@/src/models/evaluation/run';

const FAILED_EXECUTION_STATUSES = new Set<ExtractionResultStatus>([
  ExtractionResultStatus.FAILED,
  ExtractionResultStatus.ERROR,
]);

const EMPTY_STATUS_DISPLAY = '—';

const ExecutionStatusCellRenderer = (params: ICellRendererParams) => {
  const status =
    (params.data as ExtractionResult)?.executionInfo?.status || (params.data as AnalyticsResult)?.executionStatus;

  if (!status || FAILED_EXECUTION_STATUSES.has(status)) {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="text-primary dial-small-text">{EMPTY_STATUS_DISPLAY}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1">
      <ExecutionStatusIcon status={status} />
    </div>
  );
};

export default ExecutionStatusCellRenderer;
