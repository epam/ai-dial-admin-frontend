'use client';

import { FC, useMemo } from 'react';

import ConversationDetailHeader from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailHeader';
import ConversationDetailRail from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailRail';
import ConversationTimeline from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationTimeline';
import ConversationTraceView from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationTraceView';
import { useConversationTrace } from '@/src/components/Analytics/ConversationsTrace/Detail/use-conversation-trace';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay/LoadingOverlay';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  ConversationDetailRow,
  ConversationFeedbackPage,
  ConversationMessage,
  ConversationTurnRow,
} from '@/src/models/analytics/conversations-trace';
import { attributeRatingsToTurns, countFeedbackDirections } from '@/src/utils/analytics/conversation-detail-fields';

interface Props {
  conversation: ConversationDetailRow;
  feedback: ConversationFeedbackPage | null;
  turns: ConversationTurnRow[];
  messages: ConversationMessage[];
  nowMs: number;
  hasTurnsLoadError: boolean;
}

const ConversationDetailView: FC<Props> = ({ conversation, feedback, turns, messages, nowMs, hasTurnsLoadError }) => {
  const t = useI18n();
  const rows = useMemo(() => feedback?.rows ?? [], [feedback]);
  const ratings = useMemo(() => countFeedbackDirections(rows), [rows]);
  const turnRatings = useMemo(() => attributeRatingsToTurns(turns, rows), [turns, rows]);

  const { trace, isLoading, selectedSpanId, onSelectSpan, onOpenTrace, onCloseTrace } = useConversationTrace(
    conversation.chat_id,
  );

  const content = trace ? (
    <ConversationTraceView
      turnNumber={trace.turnNumber}
      traceId={trace.turn.trace_id}
      spans={trace.spans}
      total={trace.total}
      hasLoadError={trace.hasLoadError}
      selectedSpanId={selectedSpanId}
      onSelectSpan={onSelectSpan}
      onClose={onCloseTrace}
    />
  ) : (
    <div className="flex min-h-0 flex-1 rounded border border-primary">
      <ConversationTimeline
        messages={messages}
        turns={turns}
        turnRatings={turnRatings}
        hasTurnsLoadError={hasTurnsLoadError}
        turnCount={conversation.turn_count}
        onOpenTrace={onOpenTrace}
      />
      <ConversationDetailRail
        conversation={conversation}
        feedback={rows}
        feedbackTotal={feedback?.total ?? null}
        ratings={ratings}
      />
    </div>
  );

  return (
    <div className="relative flex size-full flex-col gap-5 rounded bg-layer-2 py-5 px-6">
      {!trace && <ConversationDetailHeader conversation={conversation} nowMs={nowMs} />}
      <div className="flex min-h-0 flex-1 flex-col" inert={isLoading}>
        {content}
      </div>
      {isLoading && <LoadingOverlay label={t(BasicI18nKey.Loading)} />}
    </div>
  );
};

export default ConversationDetailView;
