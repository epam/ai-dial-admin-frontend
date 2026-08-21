'use client';

import { DialEllipsisTooltip, DialNoDataContent, DialNotification, NotificationVariant } from '@epam/ai-dial-ui-kit';
import { IconAlertTriangle, IconChevronRight, IconSubtask } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC } from 'react';

import RatingCounts from '@/src/components/Analytics/ConversationsTrace/RatingCounts';
import { COST_TEXT_CLASS, EMPTY_ICON_SIZE, UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationTurnRow, RatingCounts as RatingCountsModel } from '@/src/models/analytics/conversations-trace';
import {
  formatCompactNumber,
  formatDurationMs,
  formatSignificantCost,
  toMillis,
} from '@/src/utils/analytics/conversation-formatting';
import { formatTimeToLocalString } from '@/src/utils/formatting/date';
import { toNumber } from '@/src/utils/analytics/scalar';

const ICON_SIZE = 14;
const NOTIFICATION_ICON_SIZE = 16;

interface RowProps {
  turn: ConversationTurnRow;
  turnNumber: number;
  question?: string;
  ratings?: RatingCountsModel;
  onOpenTrace: (turn: ConversationTurnRow, turnNumber: number) => void;
}

const TraceRow: FC<RowProps> = ({ turn, turnNumber, question, ratings, onOpenTrace }) => {
  const t = useI18n();
  const startedAtMs = toMillis(turn.started);
  const turnLabel = `${t(ConversationsTraceI18nKey.TraceTurn)} ${turnNumber}`;

  return (
    <button
      type="button"
      onClick={() => onOpenTrace(turn, turnNumber)}
      className="flex items-center gap-3 rounded border border-primary bg-layer-3 px-3 py-2.5 text-left hover:border-hover focus-visible:border-hover"
    >
      <IconSubtask size={ICON_SIZE} aria-hidden className="shrink-0 text-accent-primary" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="min-w-0 text-primary dial-small-semi-text">
          <DialEllipsisTooltip text={question ?? turnLabel} />
        </span>
        <span className="flex min-w-0 items-center gap-1.5 text-secondary dial-caption-text">
          {question && <span className="shrink-0">{turnLabel}</span>}
          <span className="min-w-0 font-mono">
            <DialEllipsisTooltip text={turn.trace_id} />
          </span>
        </span>
      </span>
      <span className="flex flex-wrap items-center justify-end gap-3 font-mono dial-tiny-text text-secondary">
        <span className="w-20 text-right">
          {startedAtMs === null ? UNAVAILABLE_VALUE : formatTimeToLocalString(startedAtMs)}
        </span>
        <span className="w-16 text-right">
          {formatCompactNumber(turn.hops) || '0'} {t(ConversationsTraceI18nKey.DetailHopsShort)}
        </span>
        <span className="w-20 text-right">
          {formatCompactNumber(turn.tokens) || '0'} {t(ConversationsTraceI18nKey.DetailTokensShort)}
        </span>
        <span className={classNames('w-16 text-right', COST_TEXT_CLASS)}>
          {formatSignificantCost(turn.cost) || UNAVAILABLE_VALUE}
        </span>
        <span className="w-14 text-right">{formatDurationMs(turn.duration_ms) || UNAVAILABLE_VALUE}</span>
        {ratings && <RatingCounts ratingUp={ratings.rating_up ?? 0} ratingDown={ratings.rating_down ?? 0} />}
      </span>
      <IconChevronRight size={ICON_SIZE} aria-hidden className="shrink-0 text-secondary" />
    </button>
  );
};

interface Props {
  turns: ConversationTurnRow[];
  turnRatings: RatingCountsModel[];
  questions: Map<string, string>;
  hasTurnsLoadError: boolean;
  turnCount: number | string | null;
  onOpenTrace: (turn: ConversationTurnRow, turnNumber: number) => void;
}

const ConversationTraceList: FC<Props> = ({
  turns,
  turnRatings,
  questions,
  hasTurnsLoadError,
  turnCount,
  onOpenTrace,
}) => {
  const t = useI18n();
  const totalTurns = toNumber(turnCount);
  const isClipped = totalTurns !== null && turns.length < totalTurns;

  if (!turns.length) {
    return (
      <div className="flex flex-1 flex-col justify-center bg-layer-1">
        <DialNoDataContent
          icon={
            hasTurnsLoadError ? (
              <IconAlertTriangle size={EMPTY_ICON_SIZE} aria-hidden className="text-error" />
            ) : (
              <IconSubtask size={EMPTY_ICON_SIZE} aria-hidden />
            )
          }
          title={t(
            hasTurnsLoadError
              ? ConversationsTraceI18nKey.TraceListLoadFailed
              : ConversationsTraceI18nKey.TraceListEmpty,
          )}
          description={t(
            hasTurnsLoadError
              ? ConversationsTraceI18nKey.DetailTurnsLoadFailed
              : ConversationsTraceI18nKey.TraceListEmptyHint,
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
        {isClipped && (
          <DialNotification
            variant={NotificationVariant.Info}
            iconSize={NOTIFICATION_ICON_SIZE}
            message={t(ConversationsTraceI18nKey.TranscriptTurnsTruncated, {
              loaded: formatCompactNumber(turns.length),
              total: formatCompactNumber(totalTurns),
            })}
          />
        )}
        {turns.map((turn, index) => (
          <TraceRow
            key={turn.trace_id}
            turn={turn}
            turnNumber={index + 1}
            question={questions.get(turn.trace_id)}
            ratings={turnRatings[index]}
            onOpenTrace={onOpenTrace}
          />
        ))}
      </div>
    </div>
  );
};

export default ConversationTraceList;
