'use client';

import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { ICellRendererParams } from 'ag-grid-community';
import { FC } from 'react';

import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationRow } from '@/src/models/analytics/conversations-trace';
import { conversationTitle } from '@/src/utils/analytics/conversation-detail-fields';

// The conversation's identity in one cell: its name above, its id below. The two are one column because
// the id is what the name falls back to being — rendering them side by side printed the id twice on every
// conversation the insight enrichment has not reached, which is most of them.
const ConversationCellRenderer: FC<ICellRendererParams<ConversationRow>> = ({ data }) => {
  if (!data?.client_session_id) {
    return null;
  }

  const title = conversationTitle(data);

  return (
    <div className="flex flex-col justify-center h-full min-w-0">
      <span className="text-primary dial-small-semi-text">
        {title ? <DialEllipsisTooltip text={title} /> : UNAVAILABLE_VALUE}
      </span>
      <span className="text-secondary dial-tiny-text">
        <DialEllipsisTooltip text={data.client_session_id} />
      </span>
    </div>
  );
};

export default ConversationCellRenderer;
