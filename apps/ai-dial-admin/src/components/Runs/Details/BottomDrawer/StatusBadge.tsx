import { FC } from 'react';

import classNames from 'classnames';

import { ExtractionResultStatus } from '@/src/models/evaluation/run';

interface Props {
  status?: ExtractionResultStatus;
}

const StatusBadge: FC<Props> = ({ status }) => {
  if (!status) return null;
  const isSuccess = status === 'SUCCESS';
  return (
    <span className={classNames('text-xxs font-medium', isSuccess ? 'text-success' : 'text-error')}>{status}</span>
  );
};

export default StatusBadge;
