'use client';

import { DialEllipsisTooltip, DialTooltip } from '@epam/ai-dial-ui-kit';
import { FC, Fragment, ReactNode } from 'react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { UNAVAILABLE_VALUE } from '@/src/constants/analytics/sessions-trace';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SessionDetailRow } from '@/src/models/analytics/sessions-trace';
import { sessionTitle } from '@/src/utils/analytics/session-detail-fields';
import { formatCompactNumber, formatSessionSpan, formatRelativeTime } from '@/src/utils/analytics/session-formatting';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';

interface MetaProps {
  label: string;
  value: ReactNode;
  hint?: string;
  title?: string;
  action?: ReactNode;
}

const MetaTag: FC<MetaProps> = ({ label, value, hint, title, action }) => {
  const text = (
    <span className="inline-flex min-w-0 items-center gap-1.5 font-mono dial-small-text text-secondary">
      {label}
      <span className="min-w-0 text-primary dial-small-semi-text" title={title}>
        {value}
      </span>
      {action}
    </span>
  );

  return hint ? <DialTooltip tooltip={hint}>{text}</DialTooltip> : text;
};

const Separator: FC = () => <span aria-hidden className="h-4 border-l border-primary" />;

interface Props {
  session: SessionDetailRow;
  nowMs: number;
}

const SessionDetailHeader: FC<Props> = ({ session, nowMs }) => {
  const t = useI18n();

  const project = session.project_id?.trim() ? session.project_id : t(SessionsTraceI18nKey.NoProject);

  // The metadata panel states the deployments; restating them here would present one fact twice, which is
  // what the turn count and the rating counts are already kept out of the header for.
  const meta: MetaProps[] = [
    {
      label: t(SessionsTraceI18nKey.DetailId),
      value: (
        <span className="inline-block max-w-[260px] align-bottom">
          <DialEllipsisTooltip text={session.client_session_id} />
        </span>
      ),
      action: (
        <CopyButton
          value={session.client_session_id}
          valueLabel={t(SessionsTraceI18nKey.Session)}
          className="shrink-0"
        />
      ),
    },
    { label: t(SessionsTraceI18nKey.Project), value: project },
    {
      label: t(SessionsTraceI18nKey.DetailTurns),
      value: formatCompactNumber(session.turn_count) || UNAVAILABLE_VALUE,
    },
    {
      label: t(SessionsTraceI18nKey.DetailDuration),
      value: formatSessionSpan(session.first_request_time, session.last_request_time) || UNAVAILABLE_VALUE,
    },
    {
      label: t(SessionsTraceI18nKey.DetailLastActivity),
      value: formatRelativeTime(session.last_request_time, nowMs) || UNAVAILABLE_VALUE,
      title: formatDateTimeToLocalString(session.last_request_time ?? undefined),
    },
  ];

  const title = sessionTitle(session);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      {/* The heading names the session and the id identifies it. An untitled session still needs
          an accessible heading, so the dash carries the label rather than standing alone as the name. */}
      <h1 className="min-w-0 text-primary">
        {title ? (
          <DialEllipsisTooltip text={title} />
        ) : (
          <span aria-label={t(SessionsTraceI18nKey.NoTitle)}>{UNAVAILABLE_VALUE}</span>
        )}
      </h1>
      <div className="flex flex-wrap items-center gap-3">
        {meta.map((item, index) => (
          <Fragment key={item.label}>
            {index > 0 && <Separator />}
            <MetaTag {...item} />
          </Fragment>
        ))}
      </div>
    </div>
  );
};

export default SessionDetailHeader;
