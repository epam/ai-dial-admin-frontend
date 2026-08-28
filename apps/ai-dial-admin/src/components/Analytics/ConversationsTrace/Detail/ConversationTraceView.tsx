'use client';

import { DialEllipsisTooltip, DialGhostIconButton, DialNoDataContent, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconChevronLeft, IconSubtask } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useMemo } from 'react';

import ConversationSpanDetail from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationSpanDetail';
import ConversationEventStream from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationEventStream';
import { useHopBodies } from '@/src/components/Analytics/ConversationsTrace/Detail/use-hop-bodies';
import { COST_TEXT_CLASS, UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  ConversationSpanRow,
  ConversationTraceFigures,
  ModelCallOutput,
} from '@/src/models/analytics/conversations-trace';
import {
  formatCompactNumber,
  formatDurationMs,
  formatSignificantCost,
  toMillis,
} from '@/src/utils/analytics/conversation-formatting';
import { toNumber } from '@/src/utils/analytics/scalar';
import { areSpansPartial, spanCategoryOf } from '@/src/utils/analytics/conversation-spans';
import { buildHopTree } from '@/src/utils/analytics/conversation-hop-stream';

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

interface Props {
  chatId: string;
  // What names the trace on screen. The data records no turn index, so there is no ordinal to fall back to:
  // the caller supplies the card's own name, or the transcript's question, and the trace id stands alone when
  // neither is available.
  title?: string;
  figures: ConversationTraceFigures;
  spans: ConversationSpanRow[];
  modelOutputs: ModelCallOutput[];
  hasLoadError: boolean;
  selectedSpanId: string | null;
  onSelectSpan: (coreSpanId: string) => void;
  onClose: () => void;
}

const ConversationTraceView: FC<Props> = ({
  chatId,
  title,
  figures,
  spans,
  modelOutputs,
  hasLoadError,
  selectedSpanId,
  onSelectSpan,
  onClose,
}) => {
  const t = useI18n();

  const tree = useMemo(() => buildHopTree({ spans, modelOutputs }), [spans, modelOutputs]);
  const selectedSpan = spans.find(({ core_span_id }) => core_span_id === selectedSpanId) ?? null;
  const selected = useMemo(
    () =>
      selectedSpan
        ? {
            span: selectedSpan,
            category: spanCategoryOf(selectedSpan),
            startedAtMs: toMillis(selectedSpan.request_time),
          }
        : null,
    [selectedSpan],
  );
  const {
    bodies,
    isLoading: isLoadingBodies,
    suppression: bodiesSuppression,
  } = useHopBodies(chatId, figures.traceId, selectedSpan);
  const hopCount = toNumber(figures.spans);
  const isFailed = (toNumber(figures.failedSpans) ?? 0) > 0;

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
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="flex min-w-0 items-center gap-2 text-primary">
              <IconSubtask size={ICON_SIZE} aria-hidden className="shrink-0 text-accent-primary" />
              <span className="min-w-0">
                <DialEllipsisTooltip text={title ?? figures.traceId} />
              </span>
            </h2>
            <span className="flex min-w-0 items-center gap-1.5 pl-6 text-secondary dial-tiny-text">
              {/* Suppressed when the heading already is the trace id — repeating it says nothing twice. */}
              {title !== undefined && (
                <span className="min-w-0 font-mono">
                  <DialEllipsisTooltip text={figures.traceId} />
                </span>
              )}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Stat
            label={t(ConversationsTraceI18nKey.TraceDuration)}
            value={formatDurationMs(figures.durationMs ?? null) || UNAVAILABLE_VALUE}
          />
          <Stat label={t(ConversationsTraceI18nKey.TraceTokens)} value={formatCompactNumber(figures.tokens) || '0'} />
          <Stat
            label={t(ConversationsTraceI18nKey.TraceCost)}
            value={formatSignificantCost(figures.price) || UNAVAILABLE_VALUE}
            valueClassName={COST_TEXT_CLASS}
          />
          <Stat
            label={t(ConversationsTraceI18nKey.TraceSpans)}
            value={formatCompactNumber(figures.spans) || String(spans.length)}
          />
          <Stat
            label={t(ConversationsTraceI18nKey.TraceStatus)}
            value={t(isFailed ? ConversationsTraceI18nKey.TraceFailed : ConversationsTraceI18nKey.TraceOk)}
            valueClassName={isFailed ? 'text-error' : 'text-success'}
          />
        </div>
      </div>

      {areSpansPartial(spans, hopCount) && (
        <p className="dial-tiny-text text-secondary">
          {t(ConversationsTraceI18nKey.TraceSpansPartial, { shown: spans.length, total: hopCount ?? spans.length })}
        </p>
      )}

      <div className="flex min-h-0 flex-1 rounded border border-primary">
        <div className="flex min-h-0 flex-1 overflow-hidden bg-layer-1">
          {hasLoadError ? (
            <div className="flex flex-1 items-center justify-center">
              <DialNoDataContent title={t(ConversationsTraceI18nKey.TraceLoadFailed)} />
            </div>
          ) : (
            <ConversationEventStream tree={tree} selectedSpanId={selectedSpanId} onSelectSpan={onSelectSpan} />
          )}
        </div>
        <ConversationSpanDetail
          node={selected}
          bodies={bodies}
          isLoadingBodies={isLoadingBodies}
          bodiesSuppression={bodiesSuppression}
        />
      </div>
    </div>
  );
};

export default ConversationTraceView;
