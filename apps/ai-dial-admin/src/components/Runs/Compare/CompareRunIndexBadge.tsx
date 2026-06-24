'use client';

import classNames from 'classnames';
import { FC } from 'react';

import { RUN_COMPARE_PRIMARY_INDEX, RUN_COMPARE_SECONDARY_INDEX } from '@/src/components/Runs/Compare/constants';

interface Props {
  runIndex: typeof RUN_COMPARE_PRIMARY_INDEX | typeof RUN_COMPARE_SECONDARY_INDEX;
}

const CompareRunIndexBadge: FC<Props> = ({ runIndex }) => {
  const isPrimary = runIndex === RUN_COMPARE_PRIMARY_INDEX;

  return (
    <span
      aria-hidden
      className={classNames(
        'inline-flex items-center justify-center size-4 rounded-sm dial-tiny-semi-text text-secondary shrink-0',
        isPrimary ? 'bg-accent-primary-alpha' : 'bg-success',
      )}
    >
      {runIndex}
    </span>
  );
};

export default CompareRunIndexBadge;
