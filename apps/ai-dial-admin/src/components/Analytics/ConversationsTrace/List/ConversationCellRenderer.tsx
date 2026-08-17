'use client';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';
import { FC } from 'react';

import { ConversationRow } from '@/src/models/analytics/conversations-trace';

const ConversationCellRenderer: FC<ICellRendererParams<ConversationRow>> = ({ data }) => {
  if (!data?.chat_id) {
    return null;
  }

  return (
    <div className="flex flex-col justify-center h-full min-w-0">
      <span className="text-primary dial-small-semi-text">
        <DialEllipsisTooltip text={data.chat_id} />
      </span>
    </div>
  );
};

export default ConversationCellRenderer;
