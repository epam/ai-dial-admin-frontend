'use client';

import { IconAlertCircle, IconCheck, IconClock, IconX } from '@tabler/icons-react';
import { ICellRendererParams } from 'ag-grid-community';
import classNames from 'classnames';

import { ExtractionResult, ExtractionResultStatus } from '@/src/models/evaluation/run';

const config: Record<ExtractionResultStatus, { Icon: typeof IconCheck; className: string }> = {
  SUCCESS: {
    Icon: IconCheck,
    className: 'text-success',
  },
  FAILED: {
    Icon: IconX,
    className: 'text-error',
  },
  TIMEOUT: {
    Icon: IconClock,
    className: 'text-warning',
  },
  ERROR: {
    Icon: IconAlertCircle,
    className: 'text-error',
  },
};

const ExecutionStatusCellRenderer = (params: ICellRendererParams) => {
  const status = (params.data as ExtractionResult)?.executionInfo?.status;
  if (!status) return null;

  const { Icon, className } = config[status];

  return (
    <div className="flex items-center gap-2 py-1">
      <Icon className={classNames('shrink-0', className)} size={18} />
    </div>
  );
};

export default ExecutionStatusCellRenderer;
