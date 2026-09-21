'use client';

import { DialGhostIconButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconBraces } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useState } from 'react';

import ConversationRailShell from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationRailShell';
import SpanFactRow from '@/src/components/Analytics/ConversationsTrace/Detail/SpanFactRow';
import SpanFieldsSection from '@/src/components/Analytics/ConversationsTrace/Detail/SpanFieldsSection';
import SpanKindBadge from '@/src/components/Analytics/ConversationsTrace/Detail/SpanKindBadge';
import FullscreenViewer from '@/src/components/Common/FullscreenViewer/FullscreenViewer';
import { COST_TEXT_CLASS, UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationSpanNode, SpanFactRowProps, SpanFieldGroup } from '@/src/models/analytics/conversations-trace';
import { ViewerContentType } from '@/src/types/evaluation';
import { formatSignificantCost } from '@/src/utils/analytics/conversation-formatting';
import { spanLabelOf } from '@/src/utils/analytics/conversation-spans';
import { formatDateTimeWithMillisToLocalString } from '@/src/utils/formatting/date';

const ICON_SIZE = 16;

interface Props {
  node: ConversationSpanNode | null;
  fieldGroups: SpanFieldGroup[];
}

const ConversationSpanDetail: FC<Props> = ({ node, fieldGroups }) => {
  const t = useI18n();
  const [openJsonSpanId, setOpenJsonSpanId] = useState<string | null>(null);
  // Tied to the span it was opened on: left open across a change of selection, the dialog would re-title and
  // re-fill itself with another hop's record while the reader was reading this one.
  const isJsonOpen = node !== null && openJsonSpanId === node.span.core_span_id;

  if (!node) {
    return (
      <ConversationRailShell className="items-center justify-center">
        <p className="text-center dial-small-text text-secondary">{t(ConversationsTraceI18nKey.SpanSelected)}</p>
      </ConversationRailShell>
    );
  }

  const { span, kind, hasFailed, startedAtMs } = node;
  const label = spanLabelOf(span);

  const metrics: SpanFactRowProps[] = [
    {
      label: t(ConversationsTraceI18nKey.SpanRecordedAt),
      value: startedAtMs === null ? UNAVAILABLE_VALUE : formatDateTimeWithMillisToLocalString(startedAtMs),
    },
    {
      label: t(ConversationsTraceI18nKey.SpanCostOwn),
      value: formatSignificantCost(span.deployment_price) || UNAVAILABLE_VALUE,
      valueClassName: COST_TEXT_CLASS,
    },
    {
      label: t(ConversationsTraceI18nKey.SpanCostChain),
      value: formatSignificantCost(span.total_price) || UNAVAILABLE_VALUE,
      valueClassName: COST_TEXT_CLASS,
    },
  ];

  const addresses: SpanFactRowProps[] = [
    { label: t(ConversationsTraceI18nKey.SpanEndpoint), value: span.request_uri || UNAVAILABLE_VALUE, isMono: true },
    {
      label: t(ConversationsTraceI18nKey.SpanUpstream),
      value: span.response_upstream_uri || UNAVAILABLE_VALUE,
      isMono: true,
    },
  ];

  return (
    <ConversationRailShell className="flex-col gap-3 overflow-hidden">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="break-all text-primary dial-base-semi-text">{label}</h3>
          <DialGhostIconButton
            size={ElementSize.Small}
            icon={<IconBraces size={ICON_SIZE} aria-hidden />}
            aria-label={t(ConversationsTraceI18nKey.SpanJsonOpen)}
            onClick={() => setOpenJsonSpanId(span.core_span_id)}
          />
        </div>
        <SpanKindBadge kind={kind} hasFailed={hasFailed} />
      </div>
      <dl className="grid grid-cols-2 gap-2 rounded border border-primary bg-layer-3 p-3">
        {metrics.map(({ label: metricLabel, value, valueClassName }, index) => (
          <div key={metricLabel} className={classNames('flex min-w-0 flex-col gap-0.5', index === 0 && 'col-span-2')}>
            <dt className="text-secondary dial-tiny-text">{metricLabel}</dt>
            <dd className={classNames('break-all dial-small-semi-text', valueClassName ?? 'text-primary')}>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="shrink-0 divide-y divide-tertiary rounded border border-primary bg-layer-3 px-3">
        {addresses.map((row) => (
          <SpanFactRow key={row.label} {...row} />
        ))}
      </div>
      <SpanFieldsSection groups={fieldGroups} row={span} />
      {isJsonOpen && (
        <FullscreenViewer
          isOpen
          title={label}
          content={JSON.stringify(span)}
          contentType={ViewerContentType.Json}
          onClose={() => setOpenJsonSpanId(null)}
        />
      )}
    </ConversationRailShell>
  );
};

export default ConversationSpanDetail;
