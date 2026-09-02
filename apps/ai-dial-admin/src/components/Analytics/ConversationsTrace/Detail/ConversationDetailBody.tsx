'use client';

import { FC, useCallback, useMemo } from 'react';

import ConversationDetailRail from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationDetailRail';
import ConversationTraceList from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationTraceList';
import { useConversationTraces } from '@/src/components/Analytics/ConversationsTrace/Detail/use-conversation-traces';
import {
  ConversationDetailRow,
  ConversationFeedbackRow,
  ConversationInsightField,
  ConversationTraceCard,
  ConversationTraceGroup,
  ConversationTraceFigures,
  ConversationRatingCounts,
  SessionScope,
} from '@/src/models/analytics/conversations-trace';
import { attributeRatingsToTraces, traceCardTitle } from '@/src/utils/analytics/conversation-trace-groups';

interface Props {
  conversation: ConversationDetailRow;
  insightColumns: ConversationInsightField[];
  scope: SessionScope;
  feedbackRows: ConversationFeedbackRow[];
  feedbackTotal: number | null;
  ratings: ConversationRatingCounts | null;
  isCommentTextReadable: boolean;
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

/**
 * The conversation's traces, and the panels beside them.
 *
 * The exchange itself is stated nowhere here: a conversation's readable exchange is the request history of
 * its entry span, and the trace's own Chat tab states it in the place where everything else about that trace
 * is stated. The listing renders from the conversation's own recorded calls and needs no body read, so the
 * page opens without one.
 */
const ConversationDetailBody: FC<Props> = ({
  conversation,
  insightColumns,
  feedbackRows,
  feedbackTotal,
  ratings,
  isCommentTextReadable,
  onOpenTrace,
  scope,
}) => {
  const projectId = conversation.project_id ?? '';

  const { groups, hasMore, isLoading, hasLoadError, onLoadMore } = useConversationTraces({
    scope,
    projectId,
    firstRequestTime: conversation.first_request_time,
    lastRequestTime: conversation.last_request_time,
  });

  const listingRatings = useMemo(() => attributeRatingsToTraces(groups, feedbackRows), [groups, feedbackRows]);

  // The drawer is titled by the card's own name rather than a turn ordinal: the data records no turn index,
  // and the card already names the call it describes.
  const onOpenCard = useCallback(
    (group: ConversationTraceGroup, card?: ConversationTraceCard) =>
      onOpenTrace(asTraceFigures(group, card), card ? traceCardTitle(card, group.traceId) : group.traceId),
    [onOpenTrace],
  );

  return (
    <div className="flex min-h-0 flex-1 rounded border border-primary">
      <ConversationTraceList
        groups={groups}
        traceRatings={listingRatings}
        hasMore={hasMore}
        isLoading={isLoading}
        hasLoadError={hasLoadError}
        onLoadMore={onLoadMore}
        onOpenTrace={onOpenCard}
      />
      <ConversationDetailRail
        conversation={conversation}
        insightColumns={insightColumns}
        feedback={feedbackRows}
        feedbackTotal={feedbackTotal}
        ratings={ratings}
        isCommentTextReadable={isCommentTextReadable}
      />
    </div>
  );
};

export default ConversationDetailBody;
