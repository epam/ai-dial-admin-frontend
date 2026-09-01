'use client';

import { GhostButton, ElementSize } from '@epam/ai-dial-ui-kit';
import { IconCheck } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useCallback, useMemo, useState } from 'react';

import HopMessageRow, {
  ROLE_LABEL_KEY,
} from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopMessageRow';
import { NEUTRAL_CHIP_CLASS } from '@/src/constants/analytics/conversations-trace';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { HopRequestEnvelope, MessageRole, SessionScope } from '@/src/models/analytics/conversations-trace';
import { useHopMessage } from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/use-hop-message';

interface Props {
  envelope: HopRequestEnvelope;
  scope: SessionScope;
  traceId: string;
  coreSpanId: string;
  requestTime: number | string | null;
}

const HopRequestPanel: FC<Props> = ({ envelope, scope, traceId, coreSpanId, requestTime }) => {
  const t = useI18n();
  const [role, setRole] = useState<MessageRole | null>(null);
  const { messages, loadingIndexes, onOpen, onClose } = useHopMessage({ scope, traceId, coreSpanId, requestTime });

  const shown = useMemo(
    () => (role === null ? envelope.messages : envelope.messages.filter((message) => message.role === role)),
    [envelope.messages, role],
  );
  const onToggleRole = useCallback((next: MessageRole) => setRole((current) => (current === next ? null : next)), []);

  // How many messages the envelope carried text for — the numerator of the clamp statement, not a count of
  // what was clamped.
  const withTextCount = useMemo(
    () => envelope.messages.filter(({ text }) => text !== null).length,
    [envelope.messages],
  );

  if (!envelope.messages.length) {
    return <p className="text-secondary dial-tiny-text">{t(ConversationsTraceI18nKey.InspectorNoMessages)}</p>;
  }

  return (
    // No row gap: a gap between the sticky filter and the list is a transparent band inside the scroll port,
    // and rows passing through it read as text sliding under the chips. Each block carries its own bottom
    // padding instead, so the filter's background covers every pixel between it and the first row.
    <div className="flex min-w-0 flex-col">
      {/* Sticky rather than scrolling with the list: it is the control *for* the list, and 52 messages put it
          off screen after the first flick — leaving no way to change the filter without scrolling back up.
          `bg-layer-2` is the rail's own ground, so rows pass behind it rather than through it. */}
      <div
        role="group"
        aria-label={t(ConversationsTraceI18nKey.InspectorRolesLabel)}
        className="sticky top-0 z-10 flex flex-wrap items-center gap-1 bg-layer-2 pb-3"
      >
        <GhostButton
          size={ElementSize.Small}
          aria-pressed={role === null}
          label={`${t(ConversationsTraceI18nKey.InspectorRoleAll)} ${envelope.messages.length}`}
          iconBefore={role === null ? <IconCheck {...BASE_BUTTON_ICON_PROPS} aria-hidden /> : undefined}
          onClick={() => setRole(null)}
          className={classNames('border', NEUTRAL_CHIP_CLASS, role === null && 'bg-layer-4')}
          textClassName="dial-caption-text"
        />
        {/* Only the roles the request carries get a control: a control for a role with no messages would
            filter to nothing in answer to a reasonable question. */}
        {envelope.roleCounts.map(({ role: offered, count }) => (
          <GhostButton
            key={offered}
            size={ElementSize.Small}
            aria-pressed={role === offered}
            label={`${t(ROLE_LABEL_KEY[offered])} ${count}`}
            iconBefore={role === offered ? <IconCheck {...BASE_BUTTON_ICON_PROPS} aria-hidden /> : undefined}
            onClick={() => onToggleRole(offered)}
            className={classNames('border', NEUTRAL_CHIP_CLASS, role === offered && 'bg-layer-4')}
            textClassName="dial-caption-text"
          />
        ))}
        {/* Announced, not printed. Every count it could show is already on the pressed chip — "system 1" beside
            "1 of 52 messages" — and at this width it wrapped to a row of its own, spending a line of the
            message history to restate the chip above it. Screen readers still get the change. */}
        <span role="status" aria-live="polite" className="sr-only">
          {role === null
            ? ''
            : t(ConversationsTraceI18nKey.InspectorRoleMatches, {
                count: shown.length,
                total: envelope.messages.length,
              })}
        </span>
      </div>
      {envelope.isClamped && (
        <p role="status" aria-live="polite" className="pb-3 text-secondary dial-caption-text">
          {t(ConversationsTraceI18nKey.InspectorEnvelopeClamped, {
            shown: withTextCount,
            total: envelope.messages.length,
          })}
        </p>
      )}
      <ul className="flex min-w-0 flex-col gap-2">
        {shown.map((message) => (
          <HopMessageRow
            key={message.index}
            message={message}
            opened={messages[message.index]}
            isLoading={loadingIndexes.includes(message.index)}
            onOpen={onOpen}
            onClose={onClose}
          />
        ))}
      </ul>
    </div>
  );
};

export default HopRequestPanel;
