'use client';

import { NoDataContent, Search } from '@epam/ai-dial-ui-kit';
import { IconSearch } from '@tabler/icons-react';
import { debounce } from 'lodash';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import SessionDetailRail from '@/src/components/Analytics/SessionsTrace/Detail/SessionDetailRail';
import SessionTraceList from '@/src/components/Analytics/SessionsTrace/Detail/SessionTraceList';
import { useSessionTraces } from '@/src/components/Analytics/SessionsTrace/Detail/use-session-traces';
import { EMPTY_ICON_SIZE, SESSIONS_SEARCH_DEBOUNCE_MS } from '@/src/constants/analytics/sessions-trace';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
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
  const t = useI18n();
  const projectId = source.project === null ? null : (session.project_id ?? '');
  const feedbackRows = useMemo(() => feedback?.rows ?? [], [feedback]);
  const [search, setSearch] = useState('');
  const [traceId, setTraceId] = useState('');

  const applyTraceId = useMemo(() => debounce(setTraceId, SESSIONS_SEARCH_DEBOUNCE_MS), []);

  useEffect(() => () => applyTraceId.cancel(), [applyTraceId]);

  const onSearchChange = useCallback(
    (value?: string) => {
      const next = value ?? '';
      setSearch(next);
      applyTraceId(next.trim());
    },
    [applyTraceId],
  );

  const { groups, hasMore, isLoading, hasLoadError, isSearch, onLoadMore } = useSessionTraces({
    scope,
    projectId,
    firstRequestTime: session.first_request_time,
    lastRequestTime: session.last_request_time,
    traceId: traceId || undefined,
  });

  const isNoMatch = isSearch && !groups.length && !isLoading && !hasLoadError;

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
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="border-b border-secondary bg-layer-1 px-4 py-3">
          <Search
            id="session-trace-search"
            value={search}
            onChange={onSearchChange}
            placeholder={t(SessionsTraceI18nKey.TraceSearchPlaceholder)}
          />
        </div>
        {isNoMatch ? (
          <div role="status" aria-live="polite" className="flex flex-1 flex-col justify-center bg-layer-1">
            <NoDataContent
              icon={<IconSearch size={EMPTY_ICON_SIZE} aria-hidden />}
              title={t(SessionsTraceI18nKey.TraceSearchNoMatch)}
              description={t(SessionsTraceI18nKey.TraceSearchNoMatchHint)}
              className="max-w-[520px] self-center p-6"
              titleClassName="dial-tiny-semi-text"
              descriptionClassName="dial-small-text"
            />
          </div>
        ) : (
          <SessionTraceList
            groups={groups}
            traceRatings={listingRatings}
            hasMore={hasMore}
            isLoading={isLoading}
            hasLoadError={hasLoadError}
            onLoadMore={onLoadMore}
            onOpenTrace={onOpenCard}
          />
        )}
      </div>
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
