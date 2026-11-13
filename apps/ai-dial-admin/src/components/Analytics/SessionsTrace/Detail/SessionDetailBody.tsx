'use client';

import { FC, useCallback, useMemo } from 'react';

import SessionDetailRail from '@/src/components/Analytics/SessionsTrace/Detail/SessionDetailRail';
import SessionTraceList from '@/src/components/Analytics/SessionsTrace/Detail/SessionTraceList';
import { useSessionTraces } from '@/src/components/Analytics/SessionsTrace/Detail/use-session-traces';
import { SessionsSource } from '@/src/models/analytics/sessions-source';
import {
  ColumnProvenance,
  SessionDetailRow,
  SessionEnrichmentPanel,
  SessionFeedbackPage,
  SessionTraceCard,
  SessionTraceGroup,
  SessionTraceFigures,
  SessionScope,
  SpanFieldGroup,
} from '@/src/models/analytics/sessions-trace';
import { asTraceFigures, attributeRatingsToTraces, traceCardTitle } from '@/src/utils/analytics/session-trace-groups';

interface Props {
  session: SessionDetailRow;
  source: SessionsSource;
  enrichmentPanels: SessionEnrichmentPanel[];
  enrichmentProvenance: Record<string, ColumnProvenance>;
  metadataGroups: SpanFieldGroup[];
  scope: SessionScope;
  feedback: SessionFeedbackPage | null;
  onOpenTrace: (figures: SessionTraceFigures, title?: string) => void;
}

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
  source,
  enrichmentPanels,
  enrichmentProvenance,
  metadataGroups,
  feedback,
  onOpenTrace,
  scope,
}) => {
  const projectId = source.project === null ? null : (session.project_id ?? '');
  const feedbackRows = useMemo(() => feedback?.rows ?? [], [feedback]);

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
    <div className="flex min-h-0 flex-1 rounded border border-secondary">
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
        source={source}
        enrichmentPanels={enrichmentPanels}
        enrichmentProvenance={enrichmentProvenance}
        metadataGroups={metadataGroups}
        feedback={feedback}
      />
    </div>
  );
};

export default SessionDetailBody;
