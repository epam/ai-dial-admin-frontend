'use client';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';
import { FC } from 'react';

import { ConversationRow } from '@/src/models/analytics/conversations-trace';
import { conversationTitle } from '@/src/utils/analytics/conversation-detail-fields';

const TitleCellRenderer: FC<ICellRendererParams<ConversationRow>> = ({ data }) => {
  if (!data) {
    return null;
  }

  return (
    <div className="flex flex-col justify-center h-full min-w-0">
      <span className="text-primary dial-small-text">
        <DialEllipsisTooltip text={conversationTitle(data)} />
      </span>
    </div>
  );
};

export default TitleCellRenderer;
