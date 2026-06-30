'use client';

import { FC } from 'react';

import ExecutionStatusIcon from '@/src/components/Common/ExecutionStatusIcon/ExecutionStatusIcon';
import { parseExecutionStatus } from '@/src/components/Common/ExecutionStatusIcon/utils';
import { formatFieldValue } from '@/src/components/Runs/Details/BottomDrawer/utils';

interface Props {
  raw: string | null;
}

const StatusValue: FC<Props> = ({ raw }) => {
  const status = parseExecutionStatus(raw);

  return (
    <div className="flex items-center gap-2">
      {status ? <ExecutionStatusIcon status={status} size={16} /> : null}
      <span className="text-primary dial-small-text">{formatFieldValue(raw)}</span>
    </div>
  );
};

export default StatusValue;
