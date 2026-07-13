'use client';

import { ICellRendererParams } from 'ag-grid-community';

import ExecutionStatusIcon from '@/src/components/Common/ExecutionStatusIcon/ExecutionStatusIcon';
import { COMPARE_MISSING_DISPLAY } from '@/src/components/Runs/Compare/ExecutionResults/constants';
import { AnalyticsResult, ExtractionResult, ExtractionResultStatus } from '@/src/models/evaluation/run';

const ExecutionStatusCellRenderer = (params: ICellRendererParams) => {
  const status =
    (params.data as ExtractionResult)?.executionInfo?.status || (params.data as AnalyticsResult)?.executionStatus;

  if (!status || status === ExtractionResultStatus.ERROR) {
    return (
      <div className="flex items-center gap-2 py-1">
        <span className="text-secondary dial-small-text">{COMPARE_MISSING_DISPLAY}</span>
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
