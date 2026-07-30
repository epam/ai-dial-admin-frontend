'use client';

import { FC, useMemo } from 'react';

import GridView from '@/src/components/Grid/GridView/GridView';
import {
  CONVERSATIONS_GROUP_HEADER_HEIGHT,
  CONVERSATIONS_HEADER_HEIGHT,
  CONVERSATIONS_ROW_HEIGHT,
} from '@/src/constants/analytics/conversations-trace';
import { CONVERSATIONS_TRACE_COLUMN_GROUPS } from '@/src/constants/grid-columns/grid-columns';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationRow } from '@/src/models/analytics/conversations-trace';

interface Props {
  conversations: ConversationRow[];
  hasLoadError?: boolean;
}

const ConversationsList: FC<Props> = ({ conversations, hasLoadError }) => {
  const t = useI18n();

  const columnDefs = useMemo(() => CONVERSATIONS_TRACE_COLUMN_GROUPS(t), [t]);

  const emptyStateTitle = hasLoadError
    ? ConversationsTraceI18nKey.ConversationsLoadFailed
    : ConversationsTraceI18nKey.NoConversations;

  return (
    <div className="conversations-grid size-full">
      <GridView<ConversationRow>
        rowData={conversations}
        columnDefs={columnDefs}
        additionalGridOptions={{
          rowHeight: CONVERSATIONS_ROW_HEIGHT,
          headerHeight: CONVERSATIONS_HEADER_HEIGHT,
          groupHeaderHeight: CONVERSATIONS_GROUP_HEADER_HEIGHT,
        }}
        emptyDataProps={{ title: t(emptyStateTitle) }}
        getRowId={({ data }) => data.chat_id}
      />
    </div>
  );
};

export default ConversationsList;
