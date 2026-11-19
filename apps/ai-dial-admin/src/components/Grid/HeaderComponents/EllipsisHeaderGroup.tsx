'use client';

import { FC } from 'react';
import { IHeaderGroupParams } from 'ag-grid-community';
import classNames from 'classnames';
import { EllipsisTooltip } from '@epam/ai-dial-ui-kit';

interface Props extends IHeaderGroupParams {
  isRightAligned?: boolean;
}

const EllipsisHeaderGroup: FC<Props> = ({ displayName, isRightAligned }) => (
  <EllipsisTooltip
    text={displayName}
    className={classNames('min-w-0 max-w-full dial-small-semi-text text-secondary', isRightAligned && 'text-end')}
    contentClassName="truncate"
  />
);

export default EllipsisHeaderGroup;
