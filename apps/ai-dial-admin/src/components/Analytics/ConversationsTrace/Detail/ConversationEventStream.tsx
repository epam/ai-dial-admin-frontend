'use client';

import { DialEllipsisTooltip, DialNoDataContent, ElementSize, GhostButton } from '@epam/ai-dial-ui-kit';
import { IconSubtask } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useCallback, useMemo, useState } from 'react';

import {
  COST_TEXT_CLASS,
  EMPTY_ICON_SIZE,
  HOP_EVENT_LABEL_KEY,
  HOP_EVENT_RAIL_CLASS,
  UNAVAILABLE_VALUE,
} from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopEvent, HopEventType } from '@/src/models/analytics/conversations-trace';
import {
  formatCompactNumber,
  formatDurationMs,
  formatSignificantCost,
} from '@/src/utils/analytics/conversation-formatting';
import { formatTimeToLocalString } from '@/src/utils/formatting/date';
import {
  FILTERABLE_EVENT_TYPES,
  filterEvents,
  hasFilteredRows,
  rowCountOf,
} from '@/src/utils/analytics/conversation-hop-stream';

interface RowProps {
  event: HopEvent;
  isSelected: boolean;
  onSelect: (coreSpanId: string) => void;
}

const EventRow: FC<RowProps> = ({ event, isSelected, onSelect }) => {
  const t = useI18n();
  const { span, type, label, detail, line, startedAtMs, tokens, reasoningTokens, cost } = event;
  const isOpenable = span !== null;

  const className = classNames(
    'flex w-full items-center gap-3 rounded border bg-layer-3 py-1.5 pl-0 pr-3 text-left',
    isOpenable && 'hover:border-hover focus-visible:border-hover',
    isSelected ? 'border-accent-primary' : 'border-primary',
    type === HopEventType.Error && 'border-error',
  );

  const content = (
    <>
      <span aria-hidden className={classNames('h-7 w-0.5 shrink-0 rounded-full', HOP_EVENT_RAIL_CLASS[type])} />
      <span className="w-10 shrink-0 text-right font-mono text-secondary dial-caption-text">{line}</span>
      <span className="w-24 shrink-0 font-mono text-secondary dial-caption-text">{t(HOP_EVENT_LABEL_KEY[type])}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="min-w-0 text-primary dial-small-semi-text">
          {type === HopEventType.TurnComplete ? (
            <span className="font-mono">
              {formatCompactNumber(event.hops) || '0'} {t(ConversationsTraceI18nKey.DetailHopsShort)} ·{' '}
              {formatDurationMs(event.durationMs) || UNAVAILABLE_VALUE}
            </span>
          ) : (
            <DialEllipsisTooltip text={label} />
          )}
        </span>
        {detail && (
          <span className="min-w-0 font-mono text-secondary dial-caption-text">
            <DialEllipsisTooltip text={detail} />
          </span>
        )}
      </span>
      {event.hasNoRecordedResult && (
        <span className="shrink-0 rounded bg-layer-4 px-1.5 py-0.5 text-secondary dial-caption-text">
          {t(ConversationsTraceI18nKey.EventNoRecordedResult)}
        </span>
      )}
      {reasoningTokens !== null && (
        <span className="w-16 shrink-0 text-right font-mono text-secondary dial-tiny-text">
          {t(ConversationsTraceI18nKey.EventReasoningTokens, { count: formatCompactNumber(reasoningTokens) })}
        </span>
      )}
      <span className="w-16 shrink-0 text-right font-mono text-secondary dial-tiny-text">
        {tokens === null ? '' : formatCompactNumber(tokens)}
      </span>
      <span className={classNames('w-16 shrink-0 text-right font-mono dial-tiny-text', COST_TEXT_CLASS)}>
        {formatSignificantCost(cost) || ''}
      </span>
      <span className="w-20 shrink-0 text-right font-mono text-secondary dial-tiny-text">
        {startedAtMs === null ? UNAVAILABLE_VALUE : formatTimeToLocalString(startedAtMs)}
      </span>
    </>
  );

  // A frame carries the turn's question and totals, not a hop — there is nothing to open, so it must not be
  // offered as a control that happens to be unavailable.
  if (!isOpenable) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button type="button" aria-current={isSelected} onClick={() => onSelect(span.core_span_id)} className={className}>
      {content}
    </button>
  );
};

interface Props {
  events: HopEvent[];
  selectedSpanId: string | null;
  onSelectSpan: (coreSpanId: string) => void;
}

const ConversationEventStream: FC<Props> = ({ events, selectedSpanId, onSelectSpan }) => {
  const t = useI18n();
  const [isolatedType, setIsolatedType] = useState<HopEventType | null>(null);
  const shownEvents = useMemo(
    () => (isolatedType === null ? events : filterEvents(events, [isolatedType])),
    [events, isolatedType],
  );

  const onIsolateType = useCallback(
    (type: HopEventType) => setIsolatedType((current) => (current === type ? null : type)),
    [],
  );

  if (!hasFilteredRows(events)) {
    return (
      <div className="flex flex-1 flex-col justify-center bg-layer-1">
        <DialNoDataContent
          icon={<IconSubtask size={EMPTY_ICON_SIZE} aria-hidden />}
          title={t(ConversationsTraceI18nKey.TraceNoSpans)}
          containerClassName="max-w-[520px] self-center p-6"
          titleClassName="dial-tiny-semi-text"
          descriptionClassName="dial-small-text"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div
        role="group"
        aria-label={t(ConversationsTraceI18nKey.StreamFilterLabel)}
        className="flex shrink-0 flex-wrap items-center gap-1 border-b border-primary px-4 py-2"
      >
        <GhostButton
          size={ElementSize.Small}
          aria-pressed={isolatedType === null}
          label={t(ConversationsTraceI18nKey.StreamTabAll)}
          onClick={() => setIsolatedType(null)}
          className={isolatedType === null ? 'text-primary' : 'text-secondary'}
          textClassName="dial-tiny-text"
        />
        <span aria-hidden className="mx-1 h-4 shrink-0 border-l border-primary" />
        {FILTERABLE_EVENT_TYPES.map((type) => {
          return (
            <GhostButton
              key={type}
              size={ElementSize.Small}
              aria-pressed={isolatedType === type}
              label={t(HOP_EVENT_LABEL_KEY[type])}
              onClick={() => onIsolateType(type)}
              className={classNames(isolatedType === type ? 'text-primary' : 'text-secondary')}
              textClassName="dial-tiny-text"
            />
          );
        })}
        <span role="status" aria-live="polite" className="ml-auto font-mono text-secondary dial-caption-text">
          {t(ConversationsTraceI18nKey.StreamShowing, { shown: rowCountOf(shownEvents), total: rowCountOf(events) })}
        </span>
      </div>
      <div
        role="group"
        aria-label={t(ConversationsTraceI18nKey.StreamLabel)}
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-4"
      >
        {!hasFilteredRows(shownEvents) && (
          <p className="dial-small-text text-secondary">{t(ConversationsTraceI18nKey.StreamNoEvents)}</p>
        )}
        {shownEvents.map((event) => (
          <EventRow
            key={event.key}
            event={event}
            isSelected={event.span !== null && event.span.core_span_id === selectedSpanId}
            onSelect={onSelectSpan}
          />
        ))}
      </div>
    </div>
  );
};

export default ConversationEventStream;
