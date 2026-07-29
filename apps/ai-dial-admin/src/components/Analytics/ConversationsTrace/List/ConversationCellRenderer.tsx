'use client';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';
import { FC } from 'react';

import { ConversationRow } from '@/src/models/analytics/conversations-trace';

const ConversationCellRenderer: FC<ICellRendererParams<ConversationRow>> = ({ data }) => {
  if (!data?.chat_id) {
    return null;
  }

  const { chat_id, title, snippet } = data;
  const primary = title || chat_id;
  const secondary = snippet || (title ? chat_id : null);

  return (
    <div className="flex flex-col justify-center h-full min-w-0 gap-0.5">
      <span className="text-primary dial-small-semi-text">
        <DialEllipsisTooltip text={primary} />
      </span>
      {secondary && (
        <span className="text-secondary dial-tiny-text">
          <DialEllipsisTooltip text={secondary} />
        </span>
      )}
    </div>
  );
};

export default ConversationCellRenderer;
