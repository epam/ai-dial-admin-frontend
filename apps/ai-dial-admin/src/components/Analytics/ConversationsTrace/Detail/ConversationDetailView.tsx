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
import {
  ConversationDetailRow,
  ConversationFeedbackPage,
  ConversationTranscript,
  ConversationTurnRow,
} from '@/src/models/analytics/conversations-trace';
import { attributeRatingsToTurns } from '@/src/utils/analytics/conversation-detail-fields';
import { questionsByTurn } from '@/src/utils/analytics/conversation-transcript';

interface Props {
  conversation: ConversationDetailRow;
  feedback: ConversationFeedbackPage | null;
  turns: ConversationTurnRow[];
  transcript: ConversationTranscript;
  nowMs: number;
  hasTurnsLoadError: boolean;
}

const ConversationDetailView: FC<Props> = ({ conversation, feedback, turns, transcript, nowMs, hasTurnsLoadError }) => {
  const t = useI18n();
  const rows = useMemo(() => feedback?.rows ?? [], [feedback]);
  const turnRatings = useMemo(() => attributeRatingsToTurns(turns, rows), [turns, rows]);
  const questions = useMemo(() => questionsByTurn(transcript.messages), [transcript.messages]);

  const { trace, isLoading, selectedSpanId, onSelectSpan, onOpenTrace, onCloseTrace } = useConversationTrace(
    conversation.chat_id,
  );

  const isTraceOpen = trace !== null;

  return (
    <div className="relative flex size-full flex-col gap-5 rounded bg-layer-2 py-5 px-6">
      {trace && (
        <ConversationTraceView
          chatId={conversation.chat_id}
          turnNumber={trace.turnNumber}
          turn={trace.turn}
          question={questions.get(trace.turn.trace_id)}
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
          transcript={transcript}
          turns={turns}
          turnRatings={turnRatings}
          feedbackRows={rows}
          feedbackTotal={feedback?.total ?? null}
          ratings={feedback?.ratings ?? null}
          isCommentTextReadable={feedback?.isCommentTextReadable ?? false}
          questions={questions}
          hasTurnsLoadError={hasTurnsLoadError}
          onOpenTrace={onOpenTrace}
        />
      </div>
      {isLoading && !isTraceOpen && <LoadingOverlay label={t(BasicI18nKey.Loading)} />}
    </div>
  );
};

export default ConversationDetailView;
