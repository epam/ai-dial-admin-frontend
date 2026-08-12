'use client';

import { ICellRendererParams } from 'ag-grid-community';
import { FC } from 'react';

import { ConversationRow } from '@/src/models/analytics/conversations-trace';
import { formatConversationSpan, formatRelativeTime } from '@/src/utils/analytics/conversation-formatting';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

interface Props extends ICellRendererParams<ConversationRow> {
  nowMs?: number;
}

const ActivityCellRenderer: FC<Props> = ({ data, nowMs }) => {
  if (!data) {
    return null;
  }

  const relative = formatRelativeTime(data.last_request_time, nowMs ?? Date.now());
  if (!relative) {
    return null;
  }

  const span = formatConversationSpan(data.first_request_time, data.last_request_time);

  return (
    <div className="flex flex-col justify-center h-full min-w-0 gap-0.5">
      <span
        className="text-primary dial-small-text"
        title={formatDateTimeToLocalString(data.last_request_time ?? void 0)}
      >
        {relative}
      </span>
      {span && <span className="dial-tiny-text text-secondary">{span}</span>}
    </div>
  );
};

export default ActivityCellRenderer;
