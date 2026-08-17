'use client';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';
import { FC } from 'react';

import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationRow } from '@/src/models/analytics/conversations-trace';

const UserCellRenderer: FC<ICellRendererParams<ConversationRow>> = ({ data }) => {
  if (!data) {
    return null;
  }

  return (
    <div className="flex flex-col justify-center h-full min-w-0">
      {data.user_hash ? (
        <span className="text-primary dial-small-text">
          <DialEllipsisTooltip text={data.user_hash} />
        </span>
      ) : (
        <span className="text-secondary dial-small-text">{UNAVAILABLE_VALUE}</span>
      )}
    </div>
  );
};

export default UserCellRenderer;
