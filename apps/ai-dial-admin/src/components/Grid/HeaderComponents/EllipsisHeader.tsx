'use client';

import { FC } from 'react';
import { IHeaderParams } from 'ag-grid-community';
import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';

const EllipsisHeader: FC<IHeaderParams> = ({ displayName }) => (
  <DialEllipsisTooltip
    text={displayName}
    className="min-w-0 max-w-full dial-small-semi-text text-secondary"
    contentClassName="truncate"
  />
);

export default EllipsisHeader;
