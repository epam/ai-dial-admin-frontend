'use client';

import { GhostButton, ElementSize, Switch } from '@epam/ai-dial-ui-kit';
import { IconCheck } from '@tabler/icons-react';
import classNames from 'classnames';
import { FC, useCallback, useMemo, useState } from 'react';

import HopMessageRow from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopMessageRow';
import HopRawView from '@/src/components/Analytics/ConversationsTrace/Detail/Inspector/HopRawView';
import {
  FILTER_CHIP_CLASS,
  RAW_LABEL_CLASS,
  MESSAGE_ROLE_LABEL_KEY,
  NEUTRAL_CHIP_CLASS,
  SELECTED_CHIP_CLASS,
} from '@/src/constants/analytics/conversations-trace';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  HopInspectorSide,
  HopRequestEnvelope,
  MessageRole,
  SessionScope,
} from '@/src/models/analytics/conversations-trace';
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
  // The same switch the response side carries: "show me the bytes" is one question, so it is one control in
  // one place on both sides rather than a mode that exists on one of them.
  const [isRaw, setIsRaw] = useState(false);
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
          `bg-layer-1` is the bodies section's own ground — `bg-layer-2` was the rail's, and this panel left
          the rail — so rows pass behind it rather than through it. */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-x-3 gap-y-1 bg-layer-1 pb-3">
        {/* The role filter narrows a list, so it goes with the list: showing the recorded bytes leaves
            nothing for it to narrow. */}
        {!isRaw && (
          <div
            role="group"
            aria-label={t(ConversationsTraceI18nKey.InspectorRolesLabel)}
            className="flex min-w-0 flex-wrap items-center gap-1"
          >
            <GhostButton
              size={ElementSize.Small}
              aria-pressed={role === null}
              label={`${t(ConversationsTraceI18nKey.InspectorRoleAll)} ${envelope.messages.length}`}
              iconBefore={role === null ? <IconCheck {...BASE_BUTTON_ICON_PROPS} aria-hidden /> : undefined}
              onClick={() => setRole(null)}
              className={classNames(FILTER_CHIP_CLASS, role === null ? SELECTED_CHIP_CLASS : NEUTRAL_CHIP_CLASS)}
              textClassName="dial-caption-text"
            />
            {/* Only the roles the request carries get a control: a control for a role with no messages would
            filter to nothing in answer to a reasonable question. */}
            {envelope.roleCounts.map(({ role: offered, count }) => (
              <GhostButton
                key={offered}
                size={ElementSize.Small}
                aria-pressed={role === offered}
                label={`${t(MESSAGE_ROLE_LABEL_KEY[offered])} ${count}`}
                iconBefore={role === offered ? <IconCheck {...BASE_BUTTON_ICON_PROPS} aria-hidden /> : undefined}
                onClick={() => onToggleRole(offered)}
                className={classNames(FILTER_CHIP_CLASS, role === offered ? SELECTED_CHIP_CLASS : NEUTRAL_CHIP_CLASS)}
                textClassName="dial-caption-text"
              />
            ))}
            {/* Announced, not printed. Every count it could show is already on the pressed chip — "system 1"
                beside "1 of 52 messages" — and at this width it wrapped to a row of its own, spending a line
                of the message history to restate the chip above it. Screen readers still get the change. */}
            <span role="status" aria-live="polite" className="sr-only">
              {role === null
                ? ''
                : t(ConversationsTraceI18nKey.InspectorRoleMatches, {
                    count: shown.length,
                    total: envelope.messages.length,
                  })}
            </span>
          </div>
        )}
        <div className="ml-auto">
          <Switch
            labelProps={{ label: t(ConversationsTraceI18nKey.InspectorRaw), className: RAW_LABEL_CLASS }}
            isOn={isRaw}
            onChange={setIsRaw}
          />
        </div>
      </div>
      {isRaw ? (
        <HopRawView
          scope={scope}
          traceId={traceId}
          coreSpanId={coreSpanId}
          requestTime={requestTime}
          side={HopInspectorSide.Request}
        />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};

export default HopRequestPanel;
