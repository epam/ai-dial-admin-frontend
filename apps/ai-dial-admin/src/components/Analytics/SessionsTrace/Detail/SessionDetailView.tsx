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
import {
  SessionDetailRow,
  SessionFeedbackPage,
  SessionInsightField,
  HopBodyGrants,
  SessionScope,
} from '@/src/models/analytics/sessions-trace';

interface Props {
  session: SessionDetailRow;
  // Which insight columns this instance's enrichment exposes, resolved on the server from the entity schema.
  // Built there and only passed through here, so its identity is stable and the rail's memo keeps holding.
  insightColumns: SessionInsightField[];
  feedback: SessionFeedbackPage | null;
  bodyGrants: HopBodyGrants;
  nowMs: number;
}

const SessionDetailView: FC<Props> = ({ session, insightColumns, feedback, bodyGrants, nowMs }) => {
  const t = useI18n();
  const rows = useMemo(() => feedback?.rows ?? [], [feedback]);
  // Built once and passed down: every hop-log read for this session is scoped by it, and rebuilding it per
  // consumer would give each hook a new object identity and re-fetch on every render.
  const scope = useMemo<SessionScope>(
    () => ({ id: session.client_session_id, source: session.client_session_source }),
    [session.client_session_id, session.client_session_source],
  );

  const { trace, isLoading, selectedSpanId, onSelectSpan, onOpenTrace, onCloseTrace } = useSessionTrace();

  const isTraceOpen = trace !== null;

  return (
    <div className="relative flex size-full flex-col gap-5 rounded bg-layer-2 py-5 px-6">
      {trace && (
        <SessionTraceView
          scope={scope}
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
        <SessionDetailHeader session={session} nowMs={nowMs} />
        <SessionDetailBody
          session={session}
          insightColumns={insightColumns}
          scope={scope}
          feedbackRows={rows}
          feedbackTotal={feedback?.total ?? null}
          ratings={feedback?.ratings ?? null}
          isCommentTextReadable={feedback?.isCommentTextReadable ?? false}
          onOpenTrace={onOpenTrace}
        />
      </div>
      {isLoading && !isTraceOpen && <LoadingOverlay label={t(BasicI18nKey.Loading)} />}
    </div>
  );
};

export default SessionDetailView;
