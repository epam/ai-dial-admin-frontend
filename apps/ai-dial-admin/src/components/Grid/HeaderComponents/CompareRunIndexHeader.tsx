'use client';

import { FC } from 'react';

import { IHeaderParams } from 'ag-grid-community';
import classNames from 'classnames';

import CompareRunIndexBadge from '@/src/components/Runs/Compare/CompareRunIndexBadge';
import { RUN_COMPARE_PRIMARY_INDEX, RUN_COMPARE_SECONDARY_INDEX } from '@/src/components/Runs/Compare/constants';

interface Props extends IHeaderParams {
  runIndex: typeof RUN_COMPARE_PRIMARY_INDEX | typeof RUN_COMPARE_SECONDARY_INDEX;
  label?: string;
}

const CompareRunIndexHeader: FC<Props> = ({ runIndex, label }) => (
  <div className={classNames('flex items-center size-full', label ? 'gap-1 min-w-0' : 'justify-center')}>
    <CompareRunIndexBadge runIndex={runIndex} />
    {label && <span className="dial-small-semi-text text-secondary truncate">{label}</span>}
  </div>
);

export default CompareRunIndexHeader;
