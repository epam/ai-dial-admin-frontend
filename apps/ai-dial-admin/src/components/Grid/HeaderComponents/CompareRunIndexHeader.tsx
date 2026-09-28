'use client';

import { FC } from 'react';

import { IHeaderParams } from 'ag-grid-community';
import classNames from 'classnames';

import CompareRunIndexBadge from '@/src/components/Runs/Compare/CompareRunIndexBadge';
import { RUN_COMPARE_PRIMARY_INDEX, RUN_COMPARE_SECONDARY_INDEX } from '@/src/components/Runs/Compare/constants';

interface Props extends IHeaderParams {
  runIndex: typeof RUN_COMPARE_PRIMARY_INDEX | typeof RUN_COMPARE_SECONDARY_INDEX;
  label?: string;
  isRightAligned?: boolean;
}

const CompareRunIndexHeader: FC<Props> = ({ runIndex, label, isRightAligned }) => (
  <div
    className={classNames(
      'flex items-center size-full',
      label ? classNames('gap-1 min-w-0', isRightAligned && 'justify-end') : 'justify-center',
    )}
  >
    <CompareRunIndexBadge runIndex={runIndex} />
    {label && <span className="dial-small-semi-text text-secondary truncate">{label}</span>}
  </div>
);

export default CompareRunIndexHeader;
