'use client';

import { FC } from 'react';

import { IHeaderParams } from 'ag-grid-community';
import classNames from 'classnames';

import { EllipsisTooltip } from '@epam/ai-dial-ui-kit';

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
      label && 'gap-1 min-w-0',
      isRightAligned && 'justify-end',
      !label && !isRightAligned && 'justify-center',
    )}
  >
    <CompareRunIndexBadge runIndex={runIndex} />
    {label && (
      <EllipsisTooltip
        text={label}
        className="min-w-0 max-w-full dial-small-semi-text text-secondary"
        contentClassName="truncate"
      />
    )}
  </div>
);

export default CompareRunIndexHeader;
