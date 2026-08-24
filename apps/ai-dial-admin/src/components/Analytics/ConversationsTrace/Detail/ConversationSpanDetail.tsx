'use client';

import classNames from 'classnames';
import { FC } from 'react';

import ConversationHopTexts from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationHopTexts';
import ConversationRailShell from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationRailShell';
import SpanCategoryBadge from '@/src/components/Analytics/ConversationsTrace/Detail/SpanCategoryBadge';
import { COST_TEXT_CLASS, UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  ConversationHopBodies,
  ConversationSpanNode,
  HopTextSuppression,
} from '@/src/models/analytics/conversations-trace';
import { formatCompactNumber, formatSignificantCost } from '@/src/utils/analytics/conversation-formatting';
import { formatDateTimeToLocalString } from '@/src/utils/formatting/date';
import { spanLabelOf } from '@/src/utils/analytics/conversation-spans';
import { isFailedHop } from '@/src/utils/analytics/conversation-hop-stream';

interface RowProps {
  label: string;
  value: string;
  isMono?: boolean;
  valueClassName?: string;
}

const DetailRow: FC<RowProps> = ({ label, value, isMono, valueClassName }) => (
  <div className="flex flex-col gap-0.5 border-b border-tertiary py-2 last:border-b-0">
    <span className="text-secondary dial-tiny-text">{label}</span>
    <span className={classNames('break-all dial-tiny-text', isMono && 'font-mono', valueClassName ?? 'text-primary')}>
      {value}
    </span>
  </div>
);

interface Props {
  node: ConversationSpanNode | null;
  bodies?: ConversationHopBodies | null;
  isLoadingBodies?: boolean;
  bodiesSuppression?: HopTextSuppression | null;
}

const ConversationSpanDetail: FC<Props> = ({
  node,
  bodies = null,
  isLoadingBodies = false,
  bodiesSuppression = null,
}) => {
  const t = useI18n();

  if (!node) {
    return (
      <ConversationRailShell className="items-center justify-center">
        <p className="text-center dial-small-text text-secondary">{t(ConversationsTraceI18nKey.SpanSelected)}</p>
      </ConversationRailShell>
    );
  }

  const { span, category, startedAtMs } = node;
  const hasFailed = isFailedHop(span);

  const metrics: RowProps[] = [
    {
      label: t(ConversationsTraceI18nKey.SpanRecordedAt),
      value: startedAtMs === null ? UNAVAILABLE_VALUE : formatDateTimeToLocalString(startedAtMs),
    },
    {
      label: t(ConversationsTraceI18nKey.TraceTokens),
      value: formatCompactNumber(span.total_tokens) || UNAVAILABLE_VALUE,
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
      label: t(ConversationsTraceI18nKey.SpanHttpStatus),
      value: span.response_status === null ? UNAVAILABLE_VALUE : String(span.response_status),
      isMono: true,
    },
    {
      label: t(ConversationsTraceI18nKey.TraceCost),
      value: formatSignificantCost(span.deployment_price) || UNAVAILABLE_VALUE,
      valueClassName: COST_TEXT_CLASS,
    },
  ];

  return (
    <ConversationRailShell className="flex-col gap-3">
      <div className="flex flex-col gap-2">
        <h3 className="break-all text-primary dial-base-semi-text">{spanLabelOf(span)}</h3>
        <div className="flex items-center gap-2">
          <SpanCategoryBadge category={category} />
          <span className={classNames('dial-tiny-semi-text', hasFailed ? 'text-error' : 'text-success')}>
            {t(hasFailed ? ConversationsTraceI18nKey.TraceFailed : ConversationsTraceI18nKey.TraceOk)}
          </span>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-2 rounded border border-primary bg-layer-3 p-3">
        {metrics.map(({ label, value }) => (
          <div key={label} className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-secondary dial-tiny-text">{label}</dt>
            <dd className="break-all text-primary dial-small-semi-text">{value}</dd>
          </div>
        ))}
      </dl>
      <ConversationHopTexts bodies={bodies} isLoading={isLoadingBodies} suppression={bodiesSuppression} />
      <div className="rounded border border-primary bg-layer-3 px-3">
        {facts.map((row) => (
          <DetailRow key={row.label} {...row} />
        ))}
      </div>
    </ConversationRailShell>
  );
};

export default ConversationSpanDetail;
