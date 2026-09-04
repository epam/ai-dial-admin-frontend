'use client';

import { IconArrowDownLeft, IconArrowUpRight } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC } from 'react';

import {
  HOP_METHOD_CLASS,
  HOP_STATUS_OK_CLASS,
  SPAN_FAILED_CLASS,
} from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopInspectorSide, HopTransport } from '@/src/models/analytics/conversations-trace';
import { formatBytes, formatHopDuration } from '@/src/utils/analytics/conversation-formatting';

const DIRECTION_ICON_SIZE = 14;

interface Props {
  transport: HopTransport;
  // `null` states both halves — the one case with no tab to split them across.
  side: HopInspectorSide | null;
}

// From the hop row alone, so it holds for a hop whose bodies are withheld: a section showing nothing at all
// there reads as "nothing happened" rather than "you are not being shown this".
const HopTransportLine: FC<Props> = ({ transport, side }) => {
  const t = useI18n();
  const { method, status, reason, hasFailed, requestBytes, responseBytes, durationMs } = transport;

  const isRequest = side !== HopInspectorSide.Response;
  const isResponse = side !== HopInspectorSide.Request;

  // The duration is on the span's facts sheet and the sizes are on the messages, so a tab restates neither.
  const isWhole = side === null;
  const stated = (
    isWhole
      ? [
          { label: t(ConversationsTraceI18nKey.InspectorTransportSent), value: formatBytes(requestBytes) },
          { label: t(ConversationsTraceI18nKey.InspectorTransportReceived), value: formatBytes(responseBytes) },
          { label: t(ConversationsTraceI18nKey.InspectorTransportTook), value: formatHopDuration(durationMs) },
        ]
      : []
  ).filter(({ value }) => value.length > 0);

  const verb = isRequest ? method : null;
  const isStatusStated = isResponse && status !== null;

  if (verb === null && !isStatusStated && !stated.length) {
    return null;
  }

  return (
    <dl
      role="group"
      aria-label={t(ConversationsTraceI18nKey.InspectorTransportLabel)}
      className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-0.5 font-mono text-secondary dial-caption-text"
    >
      {isRequest && !isResponse && (
        <IconArrowUpRight size={DIRECTION_ICON_SIZE} className="shrink-0 text-accent-primary" aria-hidden />
      )}
      {isResponse && !isRequest && (
        <IconArrowDownLeft
          size={DIRECTION_ICON_SIZE}
          className={classNames('shrink-0', hasFailed ? 'text-error' : 'text-success')}
          aria-hidden
        />
      )}
      {verb !== null && (
        <div className="flex min-w-0 items-center gap-1">
          <dt className="sr-only">{t(ConversationsTraceI18nKey.InspectorTransportMethod)}</dt>
          <dd className={classNames('rounded px-1.5 py-0.5', HOP_METHOD_CLASS)}>{verb}</dd>
        </div>
      )}
      {isStatusStated && (
        <div className="flex min-w-0 items-center gap-1">
          <dt className="sr-only">{t(ConversationsTraceI18nKey.InspectorTransportStatus)}</dt>
          <dd className={classNames('rounded px-1.5 py-0.5', hasFailed ? SPAN_FAILED_CLASS : HOP_STATUS_OK_CLASS)}>
            {reason === null ? status : `${status} ${reason}`}
          </dd>
        </div>
      )}
      {stated.map(({ label, value }) => (
        <div key={label} className="flex min-w-0 items-center gap-1">
          <dt>{label}</dt>
          <dd className="truncate text-primary">{value}</dd>
        </div>
      ))}
    </dl>
  );
};

export default HopTransportLine;
