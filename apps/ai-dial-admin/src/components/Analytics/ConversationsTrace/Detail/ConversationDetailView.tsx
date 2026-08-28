'use client';

import classNames from 'classnames';
import { FC, useMemo } from 'react';

import ConversationDetailBody from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailBody';
import ConversationDetailHeader from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailHeader';
import ConversationTraceView from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationTraceView';
import { useConversationTrace } from '@/src/components/Analytics/ConversationsTrace/Detail/use-conversation-trace';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay/LoadingOverlay';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationDetailRow, ConversationFeedbackPage } from '@/src/models/analytics/conversations-trace';

interface Props {
  conversation: ConversationDetailRow;
  feedback: ConversationFeedbackPage | null;
  // A schema fact, resolved at page open without any body query, so the Chat option is gated accurately
  // before the transcript itself is read.
  isTranscriptReadable: boolean;
  nowMs: number;
}

const ConversationDetailView: FC<Props> = ({ conversation, feedback, isTranscriptReadable, nowMs }) => {
  const t = useI18n();
  const rows = useMemo(() => feedback?.rows ?? [], [feedback]);

  const { trace, isLoading, selectedSpanId, onSelectSpan, onOpenTrace, onCloseTrace } = useConversationTrace(
    conversation.chat_id,
  );

  const isTraceOpen = trace !== null;

  return (
    <div className="relative flex size-full flex-col gap-5 rounded bg-layer-2 py-5 px-6">
      {trace && (
        <ConversationTraceView
          chatId={conversation.chat_id}
          figures={trace.figures}
          title={trace.title}
          spans={trace.spans}
          modelOutputs={trace.modelOutputs}
          hasLoadError={trace.hasLoadError}
          selectedSpanId={selectedSpanId}
          onSelectSpan={onSelectSpan}
          onClose={onCloseTrace}
        />
      )}
      <div
        className={classNames('flex min-h-0 flex-1 flex-col gap-5', isTraceOpen && 'hidden')}
        inert={isLoading || isTraceOpen}
      >
        <ConversationDetailHeader conversation={conversation} nowMs={nowMs} />
        <ConversationDetailBody
          conversation={conversation}
          isTranscriptReadable={isTranscriptReadable}
          feedbackRows={rows}
          feedbackTotal={feedback?.total ?? null}
          ratings={feedback?.ratings ?? null}
          isCommentTextReadable={feedback?.isCommentTextReadable ?? false}
          nowMs={nowMs}
          onOpenTrace={onOpenTrace}
        />
      </div>
      {isLoading && !isTraceOpen && <LoadingOverlay label={t(BasicI18nKey.Loading)} />}
    </div>
  );
};

export default ConversationDetailView;
