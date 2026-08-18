'use client';

import { DialLinkButton, DialNoDataContent, DialNotification, NotificationVariant } from '@epam/ai-dial-ui-kit';
import { IconAlertTriangle, IconMessageOff, IconRobot, IconSubtask, IconUser } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC } from 'react';

import RatingCounts from '@/src/components/Analytics/ConversationsTrace/RatingCounts';
import { COST_TEXT_CLASS, UNAVAILABLE_VALUE } from '@/src/constants/analytics/conversations-trace';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  ConversationMessage,
  ConversationTurnRow,
  MessageRole,
  RatingCounts as RatingCountsModel,
} from '@/src/models/analytics/conversations-trace';
import {
  formatCompactNumber,
  formatDurationMs,
  formatSignificantCost,
} from '@/src/utils/analytics/conversation-formatting';
import { toNumber } from '@/src/utils/analytics/scalar';

const ROLE_ICON_SIZE = 14;
const TRACE_ICON_SIZE = 12;
const EMPTY_ICON_SIZE = 24;
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

  return (
    <div className={classNames('flex flex-col gap-1.5', isUser ? 'items-end' : 'items-start')}>
      <RoleLabel isUser={isUser} />
      <div
        className={classNames(
          'max-w-[85%] whitespace-pre-wrap px-4 py-3 text-primary dial-small-text',
          isUser ? 'rounded-2xl rounded-br-none bg-layer-4' : 'rounded-2xl rounded-bl-none bg-layer-3',
        )}
      >
        {message.content}
      </div>
      {!isUser && <AssistantFooter turn={turn} ratings={ratings} onOpenTrace={onOpenTrace} />}
    </div>
  );
};

interface Props {
  messages: ConversationMessage[];
  turns: ConversationTurnRow[];
  turnRatings: RatingCountsModel[];
  hasTurnsLoadError: boolean;
  turnCount: number | string | null;
  onOpenTrace: (turn: ConversationTurnRow, turnNumber: number) => void;
}

const ConversationTimeline: FC<Props> = ({
  messages,
  turns,
  turnRatings,
  hasTurnsLoadError,
  turnCount,
  onOpenTrace,
}) => {
  const t = useI18n();
  // The rollup counts every turn; the list is bounded, so the two disagree only when it was clipped.
  // A null count leaves nothing to compare against, so no bound is claimed.
  const totalTurns = toNumber(turnCount);
  const isTurnListClipped = totalTurns !== null && turns.length < totalTurns;

  if (!messages.length) {
    return (
      <div className="flex flex-1 flex-col justify-center bg-layer-1">
        <DialNoDataContent
          icon={
            hasTurnsLoadError ? (
              <IconAlertTriangle size={EMPTY_ICON_SIZE} aria-hidden className="text-error" />
            ) : (
              <IconMessageOff size={EMPTY_ICON_SIZE} aria-hidden />
            )
          }
          title={t(ConversationsTraceI18nKey.DetailMessages)}
          description={t(
            hasTurnsLoadError
              ? ConversationsTraceI18nKey.DetailTurnsLoadFailed
              : ConversationsTraceI18nKey.DetailMessagesUnavailable,
          )}
          containerClassName="max-w-[520px] self-center p-6"
          titleClassName="dial-tiny-semi-text"
          descriptionClassName="dial-small-text"
        />
      </div>
    );
  }

  let assistantIndex = -1;

  const openTraceAt = (index: number) => {
    const turn = turns[index];
    return turn ? () => onOpenTrace(turn, index + 1) : undefined;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-layer-1">
      <div className="mx-auto flex w-[800px] max-w-full flex-col gap-6 px-4 py-6">
        <DialNotification
          variant={NotificationVariant.Warning}
          iconSize={NOTIFICATION_ICON_SIZE}
          message={t(ConversationsTraceI18nKey.DetailSampleMessages)}
        />
        {isTurnListClipped && (
          <DialNotification
            variant={NotificationVariant.Info}
            iconSize={NOTIFICATION_ICON_SIZE}
            message={t(ConversationsTraceI18nKey.DetailTurnsTruncated, {
              loaded: formatCompactNumber(turns.length),
              total: formatCompactNumber(totalTurns),
            })}
          />
        )}
        {messages.map((message, index) => {
          const isAssistant = message.role === MessageRole.Assistant;

          if (isAssistant) {
            assistantIndex += 1;
          }

          const turnIndex = assistantIndex;

          return (
            <Message
              key={`${message.role}-${index}`}
              message={message}
              turn={isAssistant ? turns[turnIndex] : undefined}
              ratings={isAssistant ? turnRatings[turnIndex] : undefined}
              onOpenTrace={isAssistant ? openTraceAt(turnIndex) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ConversationTimeline;
