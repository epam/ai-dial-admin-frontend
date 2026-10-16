'use client';

import { FC } from 'react';
import { IHeaderGroupParams } from 'ag-grid-community';
import { EllipsisTooltip } from '@epam/ai-dial-ui-kit';

const EllipsisHeaderGroup: FC<IHeaderGroupParams> = ({ displayName }) => (
  <EllipsisTooltip
    text={displayName}
    className="min-w-0 max-w-full dial-small-semi-text text-secondary"
    contentClassName="truncate"
  />
);

export default EllipsisHeaderGroup;
