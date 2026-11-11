'use client';

import classNames from 'classnames';
import { FC, useMemo } from 'react';

import SessionDetailBody from '@/src/components/Analytics/SessionsTrace/Detail/SessionDetailBody';
import SessionDetailHeader from '@/src/components/Analytics/SessionsTrace/Detail/SessionDetailHeader';
import SessionTraceView from '@/src/components/Analytics/SessionsTrace/Detail/SessionTraceView';
import { useSessionTrace } from '@/src/components/Analytics/SessionsTrace/Detail/use-session-trace';
import LoadingOverlay from '@/src/components/Common/LoadingOverlay/LoadingOverlay';
import { BasicI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SessionsSource } from '@/src/models/analytics/sessions-source';
import {
  ColumnProvenance,
  SessionDetailRow,
  SessionEnrichmentPanel,
  SessionFeedbackPage,
  HopBodyGrants,
  SessionScope,
  SpanFieldGroup,
} from '@/src/models/analytics/sessions-trace';

interface Props {
  session: SessionDetailRow;
  source: SessionsSource;
  // Which enrichment panels this instance's schema exposes, resolved on the server from the entity schema.
  // Built there and only passed through here, so its identity is stable and the rail's memo keeps holding.
  enrichmentPanels: SessionEnrichmentPanel[];
  enrichmentProvenance: Record<string, ColumnProvenance>;
  // The record's remaining fields grouped by the schema's tags, resolved on the server beside the insight
  // columns for the same reason: the client has no schema of its own.
  metadataGroups: SpanFieldGroup[];
  feedback: SessionFeedbackPage | null;
  bodyGrants: HopBodyGrants;
  nowMs: number;
}

const SessionDetailView: FC<Props> = ({
  session,
  source,
  enrichmentPanels,
  enrichmentProvenance,
  metadataGroups,
  feedback,
  bodyGrants,
  nowMs,
}) => {
  const t = useI18n();
  // Built once and passed down: every hop-log read for this session is scoped by it, and rebuilding it per
  // consumer would give each hook a new object identity and re-fetch on every render.
  const scope = useMemo<SessionScope>(
    () => ({ id: session.client_session_id, source: session.client_session_source }),
    [session.client_session_id, session.client_session_source],
  );

  const { trace, isLoading, selectedSpanId, onSelectSpan, onOpenTrace, onCloseTrace } = useSessionTrace();

  const isTraceOpen = trace !== null;

  return (
    <div className="relative flex size-full flex-col gap-5">
      {trace && (
        <SessionTraceView
          readKey={scope.id}
          figures={trace.figures}
          title={trace.title}
          spans={trace.spans}
          fieldGroups={trace.fieldGroups}
          bodyGrants={bodyGrants}
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
        <SessionDetailHeader session={session} source={source} nowMs={nowMs} />
        <SessionDetailBody
          session={session}
          source={source}
          enrichmentPanels={enrichmentPanels}
          enrichmentProvenance={enrichmentProvenance}
          metadataGroups={metadataGroups}
          scope={scope}
          feedback={feedback}
          onOpenTrace={onOpenTrace}
        />
      </div>
      {isLoading && !isTraceOpen && <LoadingOverlay label={t(BasicI18nKey.Loading)} />}
    </div>
  );
};

export default SessionDetailView;
