'use client';

import { FC } from 'react';
import { IHeaderParams } from 'ag-grid-community';
import classNames from 'classnames';
import { EllipsisTooltip } from '@epam/ai-dial-ui-kit';

interface Props extends IHeaderParams {
  isRightAligned?: boolean;
}

// Rendered inside the default header's `.ag-header-cell-text`, which the kit styles as uppercase 10px with
// letter spacing; the design wants sentence-case small semibold text, so those two are undone here.
const EllipsisHeader: FC<Props> = ({ displayName, isRightAligned }) => (
  <EllipsisTooltip
    text={displayName}
    className={classNames(
      'min-w-0 max-w-full dial-small-semi-text text-secondary normal-case tracking-normal',
      isRightAligned && 'text-right',
    )}
    contentClassName="truncate"
  />
);

export default EllipsisHeader;
