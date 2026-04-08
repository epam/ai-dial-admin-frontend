import { FC } from 'react';

import classNames from 'classnames';

import { ExtractionResultStatus } from '@/src/models/evaluation/run';

interface Props {
  status?: ExtractionResultStatus;
}

const StatusBadge: FC<Props> = ({ status }) => {
  if (!status) return null;
  const isSuccess = status === ExtractionResultStatus.SUCCESS;
  return (
    <span
      className={classNames(
        'dial-tiny-text px-1.5 py-px rounded-full inline-flex items-center shrink-0',
        isSuccess ? 'bg-success text-success' : 'bg-error text-error',
      )}
    >
      {status}
    </span>
  );
};

export default StatusBadge;
