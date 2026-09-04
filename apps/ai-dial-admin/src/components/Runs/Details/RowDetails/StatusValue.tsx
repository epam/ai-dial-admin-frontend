'use client';

import { FC } from 'react';

import ExecutionStatusIcon from '@/src/components/Common/ExecutionStatusIcon/ExecutionStatusIcon';
import { formatExecutionStatusLabel, parseExecutionStatus } from '@/src/components/Common/ExecutionStatusIcon/utils';

interface Props {
  raw: string | null;
}

const StatusValue: FC<Props> = ({ raw }) => {
  const status = parseExecutionStatus(raw);
  const isMissing = raw === null;

  return (
    <div className="flex items-center gap-2">
      {status ? <ExecutionStatusIcon status={status} size={16} /> : null}
      <span className={isMissing ? 'text-secondary dial-small-text' : 'text-primary dial-small-text'}>
        {formatExecutionStatusLabel(raw)}
      </span>
    </div>
  );
};

export default StatusValue;
