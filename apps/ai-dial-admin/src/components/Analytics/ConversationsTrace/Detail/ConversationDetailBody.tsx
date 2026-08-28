'use client';

import { FC, useCallback, useMemo, useState } from 'react';

import ConversationDetailRail from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailRail';
import ConversationTimeline from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationTimeline';
import ConversationTraceList from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationTraceList';
import ConversationViewSwitch from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationViewSwitch';
import { useConversationTraces } from '@/src/components/Analytics/ConversationsTrace/Detail/use-conversation-traces';
import { useConversationTranscript } from '@/src/components/Analytics/ConversationsTrace/Detail/use-conversation-transcript';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay/LoadingOverlay';
import { BasicI18nKey, ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  ConversationDetailRow,
  ConversationDetailView as DetailView,
  ConversationFeedbackRow,
  ConversationTraceCard,
  ConversationTraceGroup,
  ConversationTranscript,
  ConversationTraceFigures,
  ConversationRatingCounts,
  RatingCounts as RatingCountsModel,
} from '@/src/models/analytics/conversations-trace';
import { attributeRatingsToTraces, traceCardTitle } from '@/src/utils/analytics/conversation-trace-groups';
import { questionsByTurn } from '@/src/utils/analytics/conversation-transcript';

interface Props {
  conversation: ConversationDetailRow;
  // Whether this caller can read body columns at all — a schema fact, resolved at page open, so the Chat
  // option is gated accurately before any body read runs.
  isTranscriptReadable: boolean;
  feedbackRows: ConversationFeedbackRow[];
  feedbackTotal: number | null;
  ratings: ConversationRatingCounts | null;
  isCommentTextReadable: boolean;
  nowMs: number;
  onOpenTrace: (figures: ConversationTraceFigures, title?: string) => void;
}

// The drawer states a trace's figures, and its prop shape is still `ConversationTraceFigures` — the one type that
// currently expresses "a trace's own totals". Mapping into it here keeps the drawer, its event stream and its
// hop-body reads untouched, which is what this change scoped out. The shape is renamed when the turns model
// is deleted and its last reader is gone.
const asTraceFigures = (group: ConversationTraceGroup, card?: ConversationTraceCard): ConversationTraceFigures => ({
  traceId: group.traceId,
  startedAt: card?.startedAt ?? group.startedAt,
  spans: group.spans,
  failedSpans: group.failedSpans,
  tokens: group.tokens,
  price: group.price,
  durationMs: card?.durationMs ?? null,
});

interface ChatViewProps {
  transcript: ConversationTranscript | null;
  isLoading: boolean;
  traceRatings: Map<string, RatingCountsModel>;
  turnCount: number | string | null;
  onOpenTrace: (figures: ConversationTraceFigures, title?: string) => void;
}

// The Chat view's own loading and failure states live here rather than at the page: the transcript is read on
// the switch, so both are local to this view and leave the Trace listing intact.
const ChatView: FC<ChatViewProps> = ({ transcript, isLoading, traceRatings, turnCount, onOpenTrace }) => {
  const t = useI18n();
  // A hop chain opened from an answer is titled by that answer's question — the same thing the reader
  // clicked. Passing the trace id instead printed it twice, once as the heading and once beneath it.
  const questions = useMemo(() => questionsByTurn(transcript?.messages ?? []), [transcript?.messages]);

  if (isLoading || !transcript) {
    return (
      <div className="relative flex flex-1 bg-layer-1">
        <LoadingOverlay label={t(BasicI18nKey.Loading)} />
      </div>
    );
  }

  return (
    <ConversationTimeline
      transcript={transcript}
      traceRatings={traceRatings}
      turnCount={turnCount}
      onOpenTrace={(trace) => onOpenTrace(asTraceFigures(trace), questions.get(trace.traceId))}
    />
  );
};

const ConversationDetailBody: FC<Props> = ({
  conversation,
  isTranscriptReadable,
  feedbackRows,
  feedbackTotal,
  ratings,
  isCommentTextReadable,
  nowMs,
  onOpenTrace,
}) => {
  const t = useI18n();
  const isChatDisabled = !isTranscriptReadable;
  // The trace listing renders from the conversation's own recorded calls and needs no body read, so it is the
  // view that can always be shown.
  const [view, setView] = useState<DetailView>(DetailView.Trace);

  const projectId = conversation.project_id ?? '';

  const {
    transcript,
    isLoading: isTranscriptLoading,
    onRequestTranscript,
  } = useConversationTranscript({
    chatId: conversation.chat_id,
    projectId,
    lastRequestTime: conversation.last_request_time,
    nowMs,
  });

  // The body read is issued here — on the switch — rather than on page open, so a body-read failure states
  // itself inside the Chat view instead of taking the page down.
  const onSelectView = useCallback(
    (next: DetailView) => {
      if (next === DetailView.Chat && isChatDisabled) {
        setView(DetailView.Trace);
        return;
      }
      if (next === DetailView.Chat) {
        void onRequestTranscript();
      }
      setView(next);
    },
    [isChatDisabled, onRequestTranscript],
  );

  const { groups, hasMore, isLoading, hasLoadError, onLoadMore } = useConversationTraces({
    chatId: conversation.chat_id,
    projectId,
    firstRequestTime: conversation.first_request_time,
    lastRequestTime: conversation.last_request_time,
  });

  const listingRatings = useMemo(() => attributeRatingsToTraces(groups, feedbackRows), [groups, feedbackRows]);
  const transcriptRatings = useMemo(
    () => attributeRatingsToTraces(transcript?.traceFigures ?? [], feedbackRows),
    [transcript?.traceFigures, feedbackRows],
  );

  // The drawer is titled by the card's own name rather than a turn ordinal: the data records no turn index,
  // and the card already names the call it describes.
  const onOpenCard = useCallback(
    (group: ConversationTraceGroup, card?: ConversationTraceCard) =>
      onOpenTrace(asTraceFigures(group, card), card ? traceCardTitle(card, group.traceId) : group.traceId),
    [onOpenTrace],
  );

  return (
    <>
      <ConversationViewSwitch
        view={view}
        isChatDisabled={isChatDisabled}
        disabledReason={t(ConversationsTraceI18nKey.ViewChatUnavailable)}
        onSelectView={onSelectView}
      />
      <div className="flex min-h-0 flex-1 rounded border border-primary">
        {view === DetailView.Chat ? (
          <ChatView
            transcript={transcript}
            isLoading={isTranscriptLoading}
            traceRatings={transcriptRatings}
            turnCount={conversation.turn_count}
            onOpenTrace={onOpenTrace}
          />
        ) : (
          <ConversationTraceList
            groups={groups}
            traceRatings={listingRatings}
            hasMore={hasMore}
            isLoading={isLoading}
            hasLoadError={hasLoadError}
            onLoadMore={onLoadMore}
            onOpenTrace={onOpenCard}
          />
        )}
        <ConversationDetailRail
          conversation={conversation}
          feedback={feedbackRows}
          feedbackTotal={feedbackTotal}
          ratings={ratings}
          isCommentTextReadable={isCommentTextReadable}
        />
      </div>
    </>
  );
};

export default ConversationDetailBody;
