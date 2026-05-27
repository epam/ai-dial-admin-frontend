'use client';

import { FC } from 'react';

import { DialLoader } from '@epam/ai-dial-ui-kit';

import { RevalidationTask } from '@/src/models/evaluation/dataset';
import { RevalidationStatus } from '@/src/types/evaluation';

interface Props {
  task: RevalidationTask | null;
}

const RevalidationTaskIndicator: FC<Props> = ({ task }) => {
  if (!task) return null;

  const { status, totalCases, processedCases, validCount, invalidCount } = task;
  const isRunning = status === RevalidationStatus.RUNNING || status === RevalidationStatus.PENDING;
  const isFailed = status === RevalidationStatus.FAILED || status === RevalidationStatus.TIMED_OUT;

  const colorClass = isFailed ? 'text-error' : isRunning ? 'text-secondary' : 'text-success';

  return (
    <div className={`flex items-center gap-x-2 dial-small-text ${colorClass}`}>
      {isRunning && <DialLoader size={16} />}
      <span>
        Revalidation: {processedCases}/{totalCases} · {validCount} valid · {invalidCount} invalid
      </span>
    </div>
  );
};

export default RevalidationTaskIndicator;
