'use client';

import { ICellRendererParams } from 'ag-grid-community';
import { FC } from 'react';

import TagsCellRenderer from '@/src/components/Grid/CellRenderers/TagsCellRenderer';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationListRow, ConversationsField } from '@/src/models/analytics/conversations-trace';
import { conversationTopics } from '@/src/utils/analytics/conversation-formatting';

// Chips rather than the stored string, so a reader scans terms instead of parsing a delimiter. The whole
// list goes into the group's accessible name while the chips themselves are fitted to the cell's width —
// that is what keeps an overflowing set reachable, and it keeps the renderer's own "+N" honest, since it
// counts against everything it was given.
const TopicsCellRenderer: FC<ICellRendererParams<ConversationListRow>> = ({ data }) => {
  const t = useI18n();

  const topics = conversationTopics(data?.[ConversationsField.InsightTopics]);

  // Empty means the evaluation has not reached this conversation, which is the common case. It renders as
  // nothing at all: a dash or a zero here would state that the evaluator looked and found no topic.
  if (!topics.length) {
    return null;
  }

  return (
    <div
      role="group"
      aria-label={`${t(ConversationsTraceI18nKey.Topics)}: ${topics.join(', ')}`}
      className="flex w-full items-center overflow-hidden"
    >
      <TagsCellRenderer items={topics} />
    </div>
  );
};

export default TopicsCellRenderer;
