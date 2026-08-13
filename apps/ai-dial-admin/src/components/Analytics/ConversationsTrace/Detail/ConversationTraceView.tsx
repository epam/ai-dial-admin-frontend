'use client';

import { DialGhostIconButton, DialNoDataContent, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconChevronLeft, IconSubtask } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useMemo } from 'react';

import ConversationSpanDetail from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationSpanDetail';
import ConversationSpanList from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationSpanList';
import {
  COST_TEXT_CLASS,
  SPAN_CATEGORY_LABEL_KEY,
  SPAN_CATEGORY_RAIL_CLASS,
  UNAVAILABLE_VALUE,
} from '@/src/constants/analytics/conversations-trace';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationSpanRow, SpanCategory } from '@/src/models/analytics/conversations-trace';
import {
  formatCompactNumber,
  formatDurationMs,
  formatSignificantCost,
} from '@/src/utils/analytics/conversation-formatting';
import { areSpansPartial, buildSpanTree, traceTotalsOf } from '@/src/utils/analytics/conversation-spans';

const ICON_SIZE = 16;

interface StatProps {
  label: string;
  value: string;
  valueClassName?: string;
}

const Stat: FC<StatProps> = ({ label, value, valueClassName }) => (
  <div className="flex min-w-[88px] flex-col items-center gap-0.5 rounded border border-primary bg-layer-3 px-3.5 py-2">
    <span className={classNames('text-primary dial-body-semi-text', valueClassName)}>{value}</span>
    <span className="text-secondary dial-tiny-text">{label}</span>
  </div>
);

const Legend: FC = () => {
  const t = useI18n();

  return (
    <div className="flex flex-wrap items-center gap-3">
      {Object.values(SpanCategory).map((category) => (
        <span key={category} className="flex items-center gap-1.5 dial-tiny-text text-secondary">
          <span aria-hidden className={classNames('size-2 rounded-full', SPAN_CATEGORY_RAIL_CLASS[category])} />
          {t(SPAN_CATEGORY_LABEL_KEY[category])}
        </span>
      ))}
    </div>
  );
};

interface Props {
  turnNumber: number;
  traceId: string;
  spans: ConversationSpanRow[];
  total: number | null;
  hasLoadError: boolean;
  selectedSpanId: string | null;
  onSelectSpan: (coreSpanId: string) => void;
  onClose: () => void;
}

const ConversationTraceView: FC<Props> = ({
  turnNumber,
  traceId,
  spans,
  total,
  hasLoadError,
  selectedSpanId,
  onSelectSpan,
  onClose,
}) => {
  const t = useI18n();

  const nodes = useMemo(() => buildSpanTree(spans), [spans]);
  const totals = useMemo(() => traceTotalsOf(spans), [spans]);
  const selected = nodes.find(({ span }) => span.core_span_id === selectedSpanId) ?? null;

  return (
    <div className="flex size-full flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <DialGhostIconButton
            size={ElementSize.Small}
            icon={<IconChevronLeft {...BASE_BUTTON_ICON_PROPS} aria-hidden />}
            aria-label={t(ConversationsTraceI18nKey.TraceBackToTranscript)}
            onClick={onClose}
            className="shrink-0"
          />
          <h2 className="flex min-w-0 items-center gap-2 text-primary">
            <IconSubtask size={ICON_SIZE} aria-hidden className="shrink-0 text-accent-primary" />
            {t(ConversationsTraceI18nKey.TraceTurn)} {turnNumber}
            <span className="truncate font-mono text-secondary dial-tiny-text">{traceId}</span>
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Stat
            label={t(ConversationsTraceI18nKey.TraceLatency)}
            value={formatDurationMs(totals.latencyMs) || UNAVAILABLE_VALUE}
          />
          <Stat label={t(ConversationsTraceI18nKey.TraceTokens)} value={formatCompactNumber(totals.tokens) || '0'} />
          <Stat
            label={t(ConversationsTraceI18nKey.TraceCost)}
            value={formatSignificantCost(totals.cost) || UNAVAILABLE_VALUE}
            valueClassName={COST_TEXT_CLASS}
          />
          <Stat label={t(ConversationsTraceI18nKey.TraceSpans)} value={String(totals.spanCount)} />
          <Stat
            label={t(ConversationsTraceI18nKey.TraceStatus)}
            value={t(totals.isFailed ? ConversationsTraceI18nKey.TraceFailed : ConversationsTraceI18nKey.TraceOk)}
            valueClassName={totals.isFailed ? 'text-error' : 'text-success'}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Legend />
        {areSpansPartial(spans, total) && (
          <p className="dial-tiny-text text-secondary">
            {t(ConversationsTraceI18nKey.TraceSpansPartial, { shown: spans.length, total: total ?? spans.length })}
          </p>
        )}
      </div>

      <div className="flex min-h-0 flex-1 rounded border border-primary">
        <div className="min-h-0 flex-1 overflow-y-auto bg-layer-1">
          {hasLoadError ? (
            <div className="flex h-full items-center justify-center">
              <DialNoDataContent title={t(ConversationsTraceI18nKey.TraceLoadFailed)} />
            </div>
          ) : (
            <ConversationSpanList nodes={nodes} selectedSpanId={selectedSpanId} onSelectSpan={onSelectSpan} />
          )}
        </div>
        <ConversationSpanDetail node={selected} />
      </div>
    </div>
  );
};

export default ConversationTraceView;
