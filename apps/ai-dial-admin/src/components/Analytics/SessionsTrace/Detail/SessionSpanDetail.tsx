'use client';

import { DialGhostIconButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconBraces } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useState } from 'react';

import SessionRailShell from '@/src/components/Analytics/SessionsTrace/Detail/SessionRailShell';
import SpanFactRow from '@/src/components/Analytics/SessionsTrace/Detail/SpanFactRow';
import SpanFieldsSection from '@/src/components/Analytics/SessionsTrace/Detail/SpanFieldsSection';
import SpanKindBadge from '@/src/components/Analytics/SessionsTrace/Detail/SpanKindBadge';
import FullscreenViewer from '@/src/components/Common/FullscreenViewer/FullscreenViewer';
import { COST_TEXT_CLASS, UNAVAILABLE_VALUE } from '@/src/constants/analytics/sessions-trace';
import { SessionsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { SessionSpanNode, SpanFactRowProps, SpanFieldGroup } from '@/src/models/analytics/sessions-trace';
import { ViewerContentType } from '@/src/types/evaluation';
import { formatSignificantCost } from '@/src/utils/analytics/session-formatting';
import { spanLabelOf } from '@/src/utils/analytics/session-spans';
import { formatDateTimeWithMillisToLocalString } from '@/src/utils/formatting/date';

const ICON_SIZE = 16;

interface Props {
  node: SessionSpanNode | null;
  fieldGroups: SpanFieldGroup[];
}

const SessionSpanDetail: FC<Props> = ({ node, fieldGroups }) => {
  const t = useI18n();
  const [openJsonSpanId, setOpenJsonSpanId] = useState<string | null>(null);
  // Tied to the span it was opened on: left open across a change of selection, the dialog would re-title and
  // re-fill itself with another hop's record while the reader was reading this one.
  const isJsonOpen = node !== null && openJsonSpanId === node.span.core_span_id;

  if (!node) {
    return (
      <SessionRailShell className="items-center justify-center">
        <p className="text-center dial-small-text text-secondary">{t(SessionsTraceI18nKey.SpanSelected)}</p>
      </SessionRailShell>
    );
  }

  const { span, kind, hasFailed, startedAtMs } = node;
  const label = spanLabelOf(span);

  const metrics: SpanFactRowProps[] = [
    {
      label: t(SessionsTraceI18nKey.SpanRecordedAt),
      value: startedAtMs === null ? UNAVAILABLE_VALUE : formatDateTimeWithMillisToLocalString(startedAtMs),
    },
    {
      label: t(SessionsTraceI18nKey.SpanCostOwn),
      value: formatSignificantCost(span.deployment_price) || UNAVAILABLE_VALUE,
      valueClassName: COST_TEXT_CLASS,
    },
    {
      label: t(SessionsTraceI18nKey.SpanCostChain),
      value: formatSignificantCost(span.total_price) || UNAVAILABLE_VALUE,
      valueClassName: COST_TEXT_CLASS,
    },
  ];

  const addresses: SpanFactRowProps[] = [
    { label: t(SessionsTraceI18nKey.SpanEndpoint), value: span.request_uri || UNAVAILABLE_VALUE, isMono: true },
    {
      label: t(SessionsTraceI18nKey.SpanUpstream),
      value: span.response_upstream_uri || UNAVAILABLE_VALUE,
      isMono: true,
    },
  ];

  return (
    <SessionRailShell className="flex-col gap-3 overflow-hidden">
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="break-all text-primary dial-base-semi-text">{label}</h3>
          <DialGhostIconButton
            size={ElementSize.Small}
            icon={<IconBraces size={ICON_SIZE} aria-hidden />}
            aria-label={t(SessionsTraceI18nKey.SpanJsonOpen)}
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
    </SessionRailShell>
  );
};

export default SessionSpanDetail;
