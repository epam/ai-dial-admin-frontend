'use client';

import {
  DialEllipsisTooltip,
  DialLinkButton,
  DialNoDataContent,
  DialNotification,
  NotificationVariant,
} from '@epam/ai-dial-ui-kit';
import { IconAlertTriangle, IconChevronRight, IconSubtask } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, ReactNode, useEffect, useRef } from 'react';

import ConversationTraceChips from '@/src/components/Analytics/ConversationsTrace/Detail/ConversationTraceChips';
import RatingCounts from '@/src/components/Analytics/ConversationsTrace/RatingCounts';
import { COST_TEXT_CLASS, EMPTY_ICON_SIZE, UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { BasicI18nKey, ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  ConversationTraceCard,
  ConversationTraceGroup,
  RatingCounts as RatingCountsModel,
} from '@/src/models/analytics/conversations-trace';
import {
  formatCompactNumber,
  formatDurationMs,
  formatSignificantCost,
  toMillis,
} from '@/src/utils/analytics/conversation-formatting';
import { conversationCardId, traceCardTitle } from '@/src/utils/analytics/conversation-trace-groups';
import { formatTimeToLocalString } from '@/src/utils/formatting/date';

const ICON_SIZE = 14;
const NOTIFICATION_ICON_SIZE = 16;

const PANEL_CLASS = 'flex flex-col gap-2 rounded border border-primary bg-layer-3 px-3 py-2.5';

// One label/value pair of the middle tier. That tier is card-level throughout, so every value in it is read
// from the card's own root row — never from the trace. The label is what keeps the two registers legible.
const Fact: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <span className="flex items-baseline gap-1">
    <span className="text-secondary dial-tiny-text">{label}</span>
    <span className="font-mono text-primary dial-tiny-text">{children}</span>
  </span>
);

const StatusDot: FC<{ isFailed: boolean }> = ({ isFailed }) => (
  <span
    aria-hidden
    className={classNames('size-1.5 shrink-0 rounded-full', isFailed ? 'bg-error' : 'bg-accent-secondary')}
  />
);

// Bottom tier: the trace's own register — its chips and span count, with the drill-in affordance. Kept apart
// from the middle tier so a reader can tell which figures belong to the one call and which to the whole trace.
const TraceTier: FC<{ group: ConversationTraceGroup; hasChevron?: boolean; hasTotals?: boolean }> = ({
  group,
  hasChevron = true,
  hasTotals = false,
}) => {
  const t = useI18n();

  return (
    <span className="flex min-w-0 items-center gap-3 border-t border-primary pl-6 pt-2">
      <ConversationTraceChips chips={group.chips} />
      {/* Stated here rather than on each card when the panel holds more than one: the totals are the trace's,
          so repeating them per card would present one fact as several. */}
      {hasTotals && (
        <span className="flex shrink-0 items-center gap-3 font-mono text-secondary dial-tiny-text">
          <span>{formatCompactNumber(group.tokens) || UNAVAILABLE_VALUE}</span>
          <span className={COST_TEXT_CLASS}>{formatSignificantCost(group.price) || UNAVAILABLE_VALUE}</span>
        </span>
      )}
      {group.failedSpans > 0 && (
        <span className="shrink-0 text-error dial-tiny-text">
          {t(ConversationsTraceI18nKey.TraceFailuresInside, { count: formatCompactNumber(group.failedSpans) })}
        </span>
      )}
      <span className="ml-auto flex shrink-0 items-center gap-1 font-mono text-accent-primary dial-tiny-text">
        {t(ConversationsTraceI18nKey.TraceCardSpans, { count: formatCompactNumber(group.spans) })}
        {hasChevron && <IconChevronRight size={ICON_SIZE} aria-hidden className="shrink-0" />}
      </span>
    </span>
  );
};

interface CardProps {
  group: ConversationTraceGroup;
  card: ConversationTraceCard;
  ratings?: RatingCountsModel;
  // The trace tier, rendered inside a card only where the panel *is* the card — a single-root trace. In a
  // multi-root panel the group owns that tier once, beneath its cards.
  traceTier?: ReactNode;
  // The trace's totals ride in the card's headline only where the panel *is* the card. In a grouped panel the
  // panel tier states them once instead.
  hasTraceTotals?: boolean;
  onOpenTrace: (group: ConversationTraceGroup, card: ConversationTraceCard) => void;
}

const TraceCard: FC<CardProps> = ({ group, card, ratings, traceTier, hasTraceTotals = false, onOpenTrace }) => {
  const t = useI18n();
  const startedAtMs = toMillis(card.startedAt);
  const isFailed = card.isSuccess === false;
  const title = traceCardTitle(card, card.traceId);

  return (
    <button
      type="button"
      onClick={() => onOpenTrace(group, card)}
      className={classNames(PANEL_CLASS, 'text-left hover:border-hover focus-visible:border-hover')}
    >
      {/* Top tier: what this call is, then the trace's headline figures right-aligned. */}
      <span className="flex min-w-0 items-center gap-2">
        <IconSubtask size={ICON_SIZE} aria-hidden className="shrink-0 text-accent-primary" />
        <span className="min-w-0 text-primary dial-small-semi-text">
          <DialEllipsisTooltip text={title} />
        </span>
        {card.isCoreInternal && (
          <span className="shrink-0 rounded bg-warning px-1.5 text-warning dial-tiny-text">
            {t(ConversationsTraceI18nKey.TraceCardCoreInternal)}
          </span>
        )}
        <span className="max-w-[16ch] shrink-0 rounded bg-layer-4 px-1.5 font-mono text-secondary dial-tiny-text">
          <DialEllipsisTooltip text={card.traceId} />
        </span>
        <span className={classNames('flex shrink-0 items-center gap-1', isFailed && 'text-error')}>
          <StatusDot isFailed={isFailed} />
          <span className="dial-tiny-text">
            {isFailed
              ? `${t(ConversationsTraceI18nKey.TraceCardFailed)} ${card.responseStatus ?? ''}`.trim()
              : t(ConversationsTraceI18nKey.TraceCardSucceeded)}
          </span>
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-3 font-mono dial-tiny-text text-secondary">
          <span>{formatDurationMs(card.durationMs) || UNAVAILABLE_VALUE}</span>
          {hasTraceTotals && (
            <>
              <span>{formatCompactNumber(group.tokens) || UNAVAILABLE_VALUE}</span>
              <span className={COST_TEXT_CLASS}>{formatSignificantCost(group.price) || UNAVAILABLE_VALUE}</span>
            </>
          )}
        </span>
      </span>

      {/* Middle tier: this call's own facts, each labelled so none can be read as a trace figure. */}
      <span className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-6">
        <Fact label={t(ConversationsTraceI18nKey.TraceCardStarted)}>
          {startedAtMs === null ? UNAVAILABLE_VALUE : formatTimeToLocalString(startedAtMs)}
        </Fact>
        <Fact label={t(ConversationsTraceI18nKey.TraceCardMessages)}>
          {formatCompactNumber(card.requestMessages) || UNAVAILABLE_VALUE}
        </Fact>
        <Fact label={t(ConversationsTraceI18nKey.TraceCardOwnTokens)}>
          {formatCompactNumber(card.ownTokens) || UNAVAILABLE_VALUE}
        </Fact>
        {/* Own against chain, so a call that is free itself but expensive downstream reads as exactly that. */}
        <Fact label={t(ConversationsTraceI18nKey.TraceCardOwnPrice)}>
          <span className={COST_TEXT_CLASS}>{formatSignificantCost(card.ownPrice) || UNAVAILABLE_VALUE}</span>
        </Fact>
        <Fact label={t(ConversationsTraceI18nKey.TraceCardChainPrice)}>
          <span className={COST_TEXT_CLASS}>{formatSignificantCost(card.chainPrice) || UNAVAILABLE_VALUE}</span>
        </Fact>
        {ratings && <RatingCounts counts={ratings} />}
      </span>

      {traceTier}
    </button>
  );
};

interface UnrecordedProps {
  group: ConversationTraceGroup;
  onOpenTrace: (group: ConversationTraceGroup) => void;
}

// A trace the roots pass returned nothing for. It still renders from its own figures — the trace is real and
// its totals are real; only the call that started it cannot be described. It stays **openable**: the hop read
// is scoped by trace id alone, so its spans are reachable even where no root is. Rendering it inert stripped a
// capability every row of the previous listing had, on conversations whose every trace has this shape.
const UnrecordedRoot: FC<UnrecordedProps> = ({ group, onOpenTrace }) => {
  const t = useI18n();

  return (
    <button
      type="button"
      onClick={() => onOpenTrace(group)}
      className={classNames(PANEL_CLASS, 'text-left hover:border-hover focus-visible:border-hover')}
    >
      <span className="flex min-w-0 items-center gap-2">
        <IconAlertTriangle size={ICON_SIZE} aria-hidden className="shrink-0 text-secondary" />
        <span className="min-w-0 text-primary dial-small-semi-text">
          {t(ConversationsTraceI18nKey.TraceRootNotRecorded)}
        </span>
        <span className="max-w-[16ch] shrink-0 rounded bg-layer-4 px-1.5 font-mono text-secondary dial-tiny-text">
          <DialEllipsisTooltip text={group.traceId} />
        </span>
        {/* The trace's figures are real even though its root is not, so the panel still states them — that is
            what "renders from its trace-level figures" means. Only the middle tier is absent, because there is
            no card to speak for. */}
        <span className="ml-auto flex shrink-0 items-center gap-3 font-mono dial-tiny-text text-secondary">
          <span>{formatCompactNumber(group.tokens) || UNAVAILABLE_VALUE}</span>
          <span className={COST_TEXT_CLASS}>{formatSignificantCost(group.price) || UNAVAILABLE_VALUE}</span>
        </span>
      </span>
      <span className="pl-6 text-secondary dial-tiny-text">
        {t(ConversationsTraceI18nKey.TraceRootNotRecordedHint)}
      </span>
      <TraceTier group={group} />
    </button>
  );
};

interface GroupProps {
  group: ConversationTraceGroup;
  ratings?: RatingCountsModel;
  onOpenTrace: (group: ConversationTraceGroup, card?: ConversationTraceCard) => void;
}

// A trace and the cards beneath it. Where a trace records one client call and nothing was held back — the
// overwhelming majority — the panel *is* the card and its bottom tier carries the trace's register. Where a
// trace records more than one, the panel owns that register once, so the trace-level figures are stated where
// they belong instead of being repeated on every card.
const TraceGroup: FC<GroupProps> = ({ group, ratings, onOpenTrace }) => {
  const t = useI18n();

  if (!group.isRootRecorded) {
    return <UnrecordedRoot group={group} onOpenTrace={onOpenTrace} />;
  }

  if (group.cards.length <= 1 && group.elidedCardCount === 0) {
    return (
      <TraceCard
        group={group}
        card={group.cards[0]}
        ratings={ratings}
        traceTier={<TraceTier group={group} />}
        hasTraceTotals
        onOpenTrace={onOpenTrace}
      />
    );
  }

  const ratedCardId = conversationCardId(group);

  return (
    <div
      role="group"
      aria-label={t(ConversationsTraceI18nKey.TraceGroupLabel, { traceId: group.traceId })}
      className="flex flex-col gap-1.5 rounded border border-primary bg-layer-2 p-2"
    >
      {group.cards.map((card) => (
        <TraceCard
          key={card.coreSpanId}
          group={group}
          card={card}
          // Ratings are a trace fact, so they attach to the one card that is the conversation's own call —
          // not to a service call Core made inside the same trace, which would otherwise display the
          // reader's own rating of the answer.
          ratings={card.coreSpanId === ratedCardId ? ratings : undefined}
          onOpenTrace={onOpenTrace}
        />
      ))}
      <TraceTier group={group} hasChevron={false} hasTotals />
      {/* The cap holds back cards while the trace's own figures stay uncapped, so a capped trace's totals
          legitimately exceed what is on screen — stated rather than truncated in silence. */}
      {group.elidedCardCount > 0 && (
        <DialNotification
          variant={NotificationVariant.Info}
          iconSize={NOTIFICATION_ICON_SIZE}
          message={t(ConversationsTraceI18nKey.TraceFurtherCalls, {
            count: formatCompactNumber(group.elidedCardCount),
          })}
        />
      )}
    </div>
  );
};

interface Props {
  groups: ConversationTraceGroup[];
  traceRatings: Map<string, RatingCountsModel>;
  hasMore: boolean;
  isLoading: boolean;
  hasLoadError: boolean;
  onLoadMore: () => void;
  onOpenTrace: (group: ConversationTraceGroup, card?: ConversationTraceCard) => void;
}

const ConversationTraceList: FC<Props> = ({
  groups,
  traceRatings,
  hasMore,
  isLoading,
  hasLoadError,
  onLoadMore,
  onOpenTrace,
}) => {
  const t = useI18n();
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoading) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        onLoadMore();
      }
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
    // `isLoading` is a dependency so the observer is rebuilt once each fetch settles. Keying on the loaded
    // count instead stalled paging whenever a page returned only ids already on screen: the count did not
    // change, so the observer was never recreated and no further page was ever requested.
  }, [hasMore, isLoading, onLoadMore]);

  if (!groups.length && !isLoading) {
    return (
      <div className="flex flex-1 flex-col justify-center bg-layer-1">
        <DialNoDataContent
          icon={
            hasLoadError ? (
              <IconAlertTriangle size={EMPTY_ICON_SIZE} aria-hidden className="text-error" />
            ) : (
              <IconSubtask size={EMPTY_ICON_SIZE} aria-hidden />
            )
          }
          title={t(
            hasLoadError ? ConversationsTraceI18nKey.TraceListLoadFailed : ConversationsTraceI18nKey.TraceListEmpty,
          )}
          description={t(
            hasLoadError
              ? ConversationsTraceI18nKey.TraceListLoadFailedHint
              : ConversationsTraceI18nKey.TraceListEmptyHintLive,
          )}
          containerClassName="max-w-[520px] self-center p-6"
          titleClassName="dial-tiny-semi-text"
          descriptionClassName="dial-small-text"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-layer-1">
      <div className="flex flex-col gap-1.5 p-4">
        {/* States the rule the listing follows, so a reader knows what one panel stands for without having to
            infer it. Deliberately not "turn": the data records no turn index. */}
        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-1">
          <h3 className="text-primary dial-small-semi-text">{t(ConversationsTraceI18nKey.TraceSectionTitle)}</h3>
          <p className="font-mono text-secondary dial-tiny-text">{t(ConversationsTraceI18nKey.TraceSectionRule)}</p>
        </div>
        {hasLoadError && (
          <DialNotification
            variant={NotificationVariant.Error}
            iconSize={NOTIFICATION_ICON_SIZE}
            message={t(ConversationsTraceI18nKey.TraceListLoadFailedHint)}
          />
        )}
        {groups.map((group) => (
          <TraceGroup
            key={group.traceId}
            group={group}
            ratings={traceRatings.get(group.traceId)}
            onOpenTrace={onOpenTrace}
          />
        ))}
        {/* This is the landing view and it fetches on mount, so without this the panel renders empty while it
            does — and again on every appended page. */}
        {isLoading && (
          <p role="status" className="p-2 text-center text-secondary dial-tiny-text">
            {t(BasicI18nKey.Loading)}
          </p>
        )}
        {/* A manual fallback for the observer: a viewport tall enough to hold every loaded card never
            intersects the sentinel, and the reader would otherwise have no way to ask for the next page. */}
        {hasMore && !isLoading && (
          <DialLinkButton label={t(ConversationsTraceI18nKey.TraceListLoadMore)} onClick={onLoadMore} />
        )}
        <div ref={sentinelRef} aria-hidden className="h-px" />
      </div>
    </div>
  );
};

export default ConversationTraceList;
