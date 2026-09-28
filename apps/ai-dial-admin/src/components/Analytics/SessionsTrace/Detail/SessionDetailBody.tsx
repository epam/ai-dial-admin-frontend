'use client';

import { FC, useCallback, useMemo } from 'react';

import SessionDetailRail from '@/src/components/Analytics/SessionsTrace/Detail/SessionDetailRail';
import SessionTraceList from '@/src/components/Analytics/SessionsTrace/Detail/SessionTraceList';
import { useSessionTraces } from '@/src/components/Analytics/SessionsTrace/Detail/use-session-traces';
import {
  SessionDetailRow,
  SessionFeedbackRow,
  SessionInsightField,
  SessionTraceCard,
  SessionTraceGroup,
  SessionTraceFigures,
  SessionRatingCounts,
  SessionScope,
} from '@/src/models/analytics/sessions-trace';
import { attributeRatingsToTraces, traceCardTitle } from '@/src/utils/analytics/session-trace-groups';

interface Props {
  session: SessionDetailRow;
  insightColumns: SessionInsightField[];
  scope: SessionScope;
  feedbackRows: SessionFeedbackRow[];
  feedbackTotal: number | null;
  ratings: SessionRatingCounts | null;
  isCommentTextReadable: boolean;
  onOpenTrace: (figures: SessionTraceFigures, title?: string) => void;
}

// The drawer states a trace's figures, and its prop shape is still `SessionTraceFigures` — the one type that
// currently expresses "a trace's own totals". Mapping into it here keeps the drawer, its event stream and its
// hop-body reads untouched, which is what this change scoped out. The shape is renamed when the turns model
// is deleted and its last reader is gone.
const asTraceFigures = (group: SessionTraceGroup, card?: SessionTraceCard): SessionTraceFigures => ({
  traceId: group.traceId,
  startedAt: card?.startedAt ?? group.startedAt,
  spans: group.spans,
  failedSpans: group.failedSpans,
  tokens: group.tokens,
  price: group.price,
  durationMs: card?.durationMs ?? null,
});

/**
 * The session's traces, and the panels beside them.
 *
 * The exchange itself is stated nowhere here: a session's readable exchange is the request history of
 * its entry span, and the trace's own Chat tab states it in the place where everything else about that trace
 * is stated. The listing renders from the session's own recorded calls and needs no body read, so the
 * page opens without one.
 */
const SessionDetailBody: FC<Props> = ({
  session,
  insightColumns,
  feedbackRows,
  feedbackTotal,
  ratings,
  isCommentTextReadable,
  onOpenTrace,
  scope,
}) => {
  const projectId = session.project_id ?? '';

  const { groups, hasMore, isLoading, hasLoadError, onLoadMore } = useSessionTraces({
    scope,
    projectId,
    firstRequestTime: session.first_request_time,
    lastRequestTime: session.last_request_time,
  });

  const listingRatings = useMemo(() => attributeRatingsToTraces(groups, feedbackRows), [groups, feedbackRows]);

  // The drawer is titled by the card's own name rather than a turn ordinal: the data records no turn index,
  // and the card already names the call it describes.
  const onOpenCard = useCallback(
    (group: SessionTraceGroup, card?: SessionTraceCard) =>
      onOpenTrace(asTraceFigures(group, card), card ? traceCardTitle(card, group.traceId) : group.traceId),
    [onOpenTrace],
  );

  return (
    <div className="flex min-h-0 flex-1 rounded border border-primary">
      <SessionTraceList
        groups={groups}
        traceRatings={listingRatings}
        hasMore={hasMore}
        isLoading={isLoading}
        hasLoadError={hasLoadError}
        onLoadMore={onLoadMore}
        onOpenTrace={onOpenCard}
      />
      <SessionDetailRail
        session={session}
        insightColumns={insightColumns}
        feedback={feedbackRows}
        feedbackTotal={feedbackTotal}
        ratings={ratings}
        isCommentTextReadable={isCommentTextReadable}
      />
    </div>
  );
};

export default SessionDetailBody;
