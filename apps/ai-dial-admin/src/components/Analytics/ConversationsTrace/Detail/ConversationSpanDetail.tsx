'use client';

import classNames from 'classnames';
import { FC } from 'react';

import ConversationRailShell from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationRailShell';
import SpanKindBadge from '@/src/components/Analytics/ConversationsTrace/Detail/SpanKindBadge';
import { COST_TEXT_CLASS, UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationSpanNode } from '@/src/models/analytics/conversations-trace';
import {
  formatCompactNumber,
  formatHopDuration,
  formatSignificantCost,
} from '@/src/utils/analytics/conversation-formatting';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { spanLabelOf } from '@/src/utils/analytics/conversation-spans';

interface RowProps {
  label: string;
  value: string;
  isMono?: boolean;
  valueClassName?: string;
}

const DetailRow: FC<RowProps> = ({ label, value, isMono, valueClassName }) => (
  <div className="flex flex-col gap-0.5 border-b border-tertiary py-1.5 last:border-b-0">
    <span className="text-secondary dial-tiny-text">{label}</span>
    <span className={classNames('break-all dial-tiny-text', isMono && 'font-mono', valueClassName ?? 'text-primary')}>
      {value}
    </span>
  </div>
);

interface Props {
  node: ConversationSpanNode | null;
}

// The span's own facts, and nothing that has to be read from a body. The request, the response and the
// conversation live in the section below the tree instead: those are the surface a reader works in and need
// the width, while these are reference facts checked once per hop and read fine in a 360px rail.
// The recorded HTTP status is not among them: it is stated by the bodies section's transport line, beside the
// two bodies it is the question about.
const ConversationSpanDetail: FC<Props> = ({ node }) => {
  const t = useI18n();

  if (!node) {
    return (
      <ConversationRailShell className="items-center justify-center">
        <p className="text-center dial-small-text text-secondary">{t(ConversationsTraceI18nKey.SpanSelected)}</p>
      </ConversationRailShell>
    );
  }

  const { span, kind, hasFailed, startedAtMs } = node;

  const metrics: RowProps[] = [
    {
      label: t(ConversationsTraceI18nKey.SpanRecordedAt),
      value: startedAtMs === null ? UNAVAILABLE_VALUE : formatDateTimeToLocalString(startedAtMs),
    },
    {
      label: t(ConversationsTraceI18nKey.TraceTokens),
      value: formatCompactNumber(span.total_tokens) || UNAVAILABLE_VALUE,
    },
    // Hop scale, not conversation scale: a 15 ms handshake reads as `15ms` rather than as `0s`. A reported
    // zero yields nothing, which is the honest reading — a core predating the field stores zero for "not
    // reported" — so the row supplies the placeholder instead.
    {
      label: t(ConversationsTraceI18nKey.DetailDuration),
      value: formatHopDuration(span.operation_duration_ms) || UNAVAILABLE_VALUE,
    },
  ];

  const mcpFacts: RowProps[] = [
    ...(span.mcp_tool_call_name
      ? [{ label: t(ConversationsTraceI18nKey.SpanMcpTool), value: span.mcp_tool_call_name, isMono: true }]
      : []),
    ...(span.mcp_method
      ? [{ label: t(ConversationsTraceI18nKey.SpanMcpMethod), value: span.mcp_method, isMono: true }]
      : []),
    ...(span.execution_path?.length
      ? [{ label: t(ConversationsTraceI18nKey.SpanRouting), value: span.execution_path.join(' → '), isMono: true }]
      : []),
  ];

  const facts: RowProps[] = [
    ...mcpFacts,
    { label: t(ConversationsTraceI18nKey.SpanEndpoint), value: span.request_uri || UNAVAILABLE_VALUE, isMono: true },
    {
      label: t(ConversationsTraceI18nKey.SpanUpstream),
      value: span.response_upstream_uri || UNAVAILABLE_VALUE,
      isMono: true,
    },
    {
      label: t(ConversationsTraceI18nKey.SpanParent),
      value: span.parent_deployment || UNAVAILABLE_VALUE,
      isMono: true,
    },
    {
      label: t(ConversationsTraceI18nKey.TraceCost),
      value: formatSignificantCost(span.deployment_price) || UNAVAILABLE_VALUE,
      valueClassName: COST_TEXT_CLASS,
    },
  ];

  return (
    <ConversationRailShell className="flex-col gap-3 overflow-hidden">
      <div className="flex flex-col gap-2">
        <h3 className="break-all text-primary dial-base-semi-text">{spanLabelOf(span)}</h3>
        {/* Kind and outcome, side by side. The badge no longer reports a failure in place of the kind. */}
        <SpanKindBadge kind={kind} hasFailed={hasFailed} />
      </div>
      <dl className="grid grid-cols-2 gap-2 rounded border border-primary bg-layer-3 p-3">
        {metrics.map(({ label, value }) => (
          <div key={label} className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-secondary dial-tiny-text">{label}</dt>
            <dd className="break-all text-primary dial-small-semi-text">{value}</dd>
          </div>
        ))}
      </dl>
      {/* Uncapped: these rows have the rail to themselves, so growing costs no other section its room.
          Focusable, because it still scrolls when a hop records a long endpoint and a long upstream. */}
      <div tabIndex={0} className="min-h-0 flex-1 overflow-y-auto rounded border border-primary bg-layer-3 px-3">
        {facts.map((row) => (
          <DetailRow key={row.label} {...row} />
        ))}
      </div>
    </ConversationRailShell>
  );
};

export default ConversationSpanDetail;
