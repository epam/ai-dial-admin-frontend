'use client';

import { DialLinkButton, DialNoDataContent, DialNotification, NotificationVariant } from '@epam/ai-dial-ui-kit';
import {
  IconAlertTriangle,
  IconClockOff,
  IconEyeOff,
  IconMessageOff,
  IconPuzzleOff,
  IconRobot,
  IconSubtask,
  IconUser,
} from '@tabler/icons-react';
import classNames from 'classnames';
import { FC } from 'react';

import RatingCounts from '@/src/components/Analytics/ConversationsTrace/RatingCounts';
import { COST_TEXT_CLASS, EMPTY_ICON_SIZE, UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  ConversationMessage,
  ConversationTranscript,
  ConversationTurnRow,
  MessageRole,
  RatingCounts as RatingCountsModel,
  TranscriptState,
  TranscriptStatePresentation,
} from '@/src/models/analytics/conversations-trace';
import {
  formatCompactNumber,
  formatDurationMs,
  formatSignificantCost,
} from '@/src/utils/analytics/conversation-formatting';
import { toNumber } from '@/src/utils/analytics/scalar';

const ROLE_ICON_SIZE = 14;
const TRACE_ICON_SIZE = 12;
const NOTIFICATION_ICON_SIZE = 16;

interface FooterProps {
  turn?: ConversationTurnRow;
  ratings?: RatingCountsModel;
  onOpenTrace?: () => void;
}

const AssistantFooter: FC<FooterProps> = ({ turn, ratings, onOpenTrace }) => {
  const t = useI18n();

  if (!turn) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-3 pl-1 font-mono dial-tiny-text text-secondary">
      <span>
        {formatCompactNumber(turn.tokens)} {t(ConversationsTraceI18nKey.DetailTokensShort)}
      </span>
      <span className={COST_TEXT_CLASS}>{formatSignificantCost(turn.cost)}</span>
      <span>
        {formatCompactNumber(turn.hops)} {t(ConversationsTraceI18nKey.DetailHopsShort)}
      </span>
      <span>{formatDurationMs(turn.duration_ms) || UNAVAILABLE_VALUE}</span>
      {onOpenTrace && (
        <DialLinkButton
          iconBefore={<IconSubtask size={TRACE_ICON_SIZE} aria-hidden />}
          label={t(ConversationsTraceI18nKey.TraceOpen)}
          onClick={onOpenTrace}
        />
      )}
      {ratings && <RatingCounts ratingUp={ratings.rating_up ?? 0} ratingDown={ratings.rating_down ?? 0} />}
    </div>
  );
};

interface MessageProps {
  message: ConversationMessage;
  turn?: ConversationTurnRow;
  ratings?: RatingCountsModel;
  onOpenTrace?: () => void;
}

const STATE_PRESENTATION: Record<Exclude<TranscriptState, TranscriptState.Available>, TranscriptStatePresentation> = {
  [TranscriptState.ColumnsUnavailable]: {
    titleKey: ConversationsTraceI18nKey.TranscriptColumnsUnavailable,
    hintKey: ConversationsTraceI18nKey.TranscriptColumnsUnavailableHint,
    icon: IconEyeOff,
    isError: false,
  },
  [TranscriptState.NotReconstructable]: {
    titleKey: ConversationsTraceI18nKey.TranscriptNotReconstructable,
    hintKey: ConversationsTraceI18nKey.TranscriptNotReconstructableHint,
    icon: IconPuzzleOff,
    isError: false,
  },
  [TranscriptState.Expired]: {
    titleKey: ConversationsTraceI18nKey.TranscriptExpired,
    hintKey: ConversationsTraceI18nKey.TranscriptExpiredHint,
    icon: IconClockOff,
    isError: false,
  },
  [TranscriptState.NoMessages]: {
    titleKey: ConversationsTraceI18nKey.TranscriptNoMessages,
    hintKey: ConversationsTraceI18nKey.TranscriptNoMessagesHint,
    icon: IconMessageOff,
    isError: false,
  },
  [TranscriptState.LoadFailed]: {
    titleKey: ConversationsTraceI18nKey.TranscriptLoadFailed,
    hintKey: ConversationsTraceI18nKey.TranscriptLoadFailedHint,
    icon: IconAlertTriangle,
    isError: true,
  },
};

// An available transcript reaching the empty branch carried no message, which is the same nothing-to-show
// as a conversation that recorded none.
const emptyStateOf = (
  state: TranscriptState,
  hasTurnsLoadError: boolean,
): Exclude<TranscriptState, TranscriptState.Available> => {
  if (hasTurnsLoadError) {
    return TranscriptState.LoadFailed;
  }

  return state === TranscriptState.Available ? TranscriptState.NoMessages : state;
};

const RoleLabel: FC<{ isUser: boolean }> = ({ isUser }) => {
  const t = useI18n();
  const Icon = isUser ? IconUser : IconRobot;

  return (
    <span
      className={classNames(
        'flex items-center gap-1.5 dial-tiny-semi-text text-secondary',
        isUser && 'flex-row-reverse',
      )}
    >
      <Icon size={ROLE_ICON_SIZE} aria-hidden className={isUser ? 'text-secondary' : 'text-accent-secondary'} />
      {t(isUser ? ConversationsTraceI18nKey.DetailRoleUser : ConversationsTraceI18nKey.DetailRoleAssistant)}
    </span>
  );
};

const Message: FC<MessageProps> = ({ message, turn, ratings, onOpenTrace }) => {
  const isUser = message.role === MessageRole.User;
  const hasContent = message.content !== null && message.content !== '';

  return (
    <div className={classNames('flex flex-col gap-1.5', isUser ? 'items-end' : 'items-start')}>
      <RoleLabel isUser={isUser} />
      <div
        className={classNames(
          'max-w-[85%] whitespace-pre-wrap px-4 py-3 dial-small-text',
          hasContent ? 'text-primary' : 'text-secondary italic',
          isUser ? 'rounded-2xl rounded-br-none bg-layer-4' : 'rounded-2xl rounded-bl-none bg-layer-3',
        )}
      >
        {hasContent ? message.content : UNAVAILABLE_VALUE}
      </div>
      {!isUser && <AssistantFooter turn={turn} ratings={ratings} onOpenTrace={onOpenTrace} />}
    </div>
  );
};

interface Props {
  transcript: ConversationTranscript;
  turns: ConversationTurnRow[];
  turnRatings: RatingCountsModel[];
  hasTurnsLoadError: boolean;
  turnCount: number | string | null;
  onOpenTrace: (turn: ConversationTurnRow, turnNumber: number) => void;
}

interface TurnContext {
  turn?: ConversationTurnRow;
  ratings?: RatingCountsModel;
  turnNumber: number;
}

const turnContextOf = (
  traceId: string,
  turns: ConversationTurnRow[],
  turnRatings: RatingCountsModel[],
): TurnContext => {
  const index = turns.findIndex((turn) => turn.trace_id === traceId);

  return index === -1 ? { turnNumber: 0 } : { turn: turns[index], ratings: turnRatings[index], turnNumber: index + 1 };
};

const ConversationTimeline: FC<Props> = ({
  transcript,
  turns,
  turnRatings,
  hasTurnsLoadError,
  turnCount,
  onOpenTrace,
}) => {
  const t = useI18n();
  // The rollup counts every turn; the transcript read is bounded, so the two disagree only when it was
  // clipped. A null count leaves nothing to compare against, so no bound is claimed.
  const totalTurns = toNumber(turnCount);
  const { state, messages, loadedTurns } = transcript;
  const isTranscriptClipped = totalTurns !== null && loadedTurns !== null && loadedTurns < totalTurns;

  if (state !== TranscriptState.Available || !messages.length) {
    const presentation = STATE_PRESENTATION[emptyStateOf(state, hasTurnsLoadError)];
    const Icon = presentation.icon;

    return (
      <div className="flex flex-1 flex-col justify-center bg-layer-1">
        <DialNoDataContent
          icon={<Icon size={EMPTY_ICON_SIZE} aria-hidden className={presentation.isError ? 'text-error' : undefined} />}
          title={t(presentation.titleKey)}
          description={t(presentation.hintKey)}
          containerClassName="max-w-[520px] self-center p-6"
          titleClassName="dial-tiny-semi-text"
          descriptionClassName="dial-small-text"
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-layer-1">
      <div className="mx-auto flex w-[800px] max-w-full flex-col gap-6 px-4 py-6">
        {hasTurnsLoadError && (
          <DialNotification
            variant={NotificationVariant.Error}
            iconSize={NOTIFICATION_ICON_SIZE}
            message={t(ConversationsTraceI18nKey.DetailTurnsLoadFailed)}
          />
        )}
        {isTranscriptClipped && (
          <DialNotification
            variant={NotificationVariant.Info}
            iconSize={NOTIFICATION_ICON_SIZE}
            message={t(ConversationsTraceI18nKey.TranscriptTurnsTruncated, {
              loaded: formatCompactNumber(loadedTurns),
              total: formatCompactNumber(totalTurns),
            })}
          />
        )}
        {messages.map((message, index) => {
          const isAssistant = message.role === MessageRole.Assistant;
          const { turn, ratings, turnNumber } = turnContextOf(message.trace_id, turns, turnRatings);

          return (
            <Message
              key={`${message.trace_id}-${message.role}-${index}`}
              message={message}
              turn={isAssistant ? turn : undefined}
              ratings={isAssistant ? ratings : undefined}
              onOpenTrace={isAssistant && turn ? () => onOpenTrace(turn, turnNumber) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ConversationTimeline;
