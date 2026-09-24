'use client';

import { FC } from 'react';
import { IHeaderParams } from 'ag-grid-community';
import classNames from 'classnames';
import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

interface Props extends IHeaderParams {
  isRightAligned?: boolean;
}

const EllipsisHeader: FC<Props> = ({ displayName, isRightAligned }) => (
  <DialEllipsisTooltip
    text={displayName}
    className={classNames('min-w-0 max-w-full dial-small-semi-text text-secondary', isRightAligned && 'text-right')}
    contentClassName="truncate"
  />
);

export default EllipsisHeader;
