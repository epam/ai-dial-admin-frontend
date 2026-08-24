'use client';

import { DialLoader, DialNotification, NotificationVariant } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { ConversationsTraceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ConversationHopBodies, HopTextSuppression, HopTextsState } from '@/src/models/analytics/conversations-trace';

const LOADER_SIZE = 18;

interface BlockProps {
  label: string;
  text: string;
}

const TextBlock: FC<BlockProps> = ({ label, text }) => (
  <div className="flex min-w-0 flex-col gap-1">
    <span className="text-secondary dial-tiny-text">{label}</span>
    {/* Focusable because it scrolls: a hop's text runs past this height, and a keyboard-only reader has no
        other way to reach the rest of it. */}
    <p
      tabIndex={0}
      className="max-h-64 overflow-y-auto whitespace-pre-wrap break-words rounded border border-primary bg-layer-1 p-2 text-primary dial-tiny-text"
    >
      {text}
    </p>
  </div>
);

const StateNote: FC<{ text: string }> = ({ text }) => (
  <p
    role="status"
    aria-live="polite"
    className="rounded border border-primary bg-layer-3 p-3 dial-tiny-text text-secondary"
  >
    {text}
  </p>
);

const SUPPRESSION_REASON_KEY: Record<HopTextSuppression, string> = {
  [HopTextSuppression.NoResponse]: ConversationsTraceI18nKey.SpanTextsNoResponse,
  [HopTextSuppression.SessionSetup]: ConversationsTraceI18nKey.SpanTextsSessionSetup,
  [HopTextSuppression.Embedding]: ConversationsTraceI18nKey.SpanTextsEmbedding,
};

interface Props {
  bodies: ConversationHopBodies | null;
  isLoading: boolean;
  suppression?: HopTextSuppression | null;
}

const ConversationHopTexts: FC<Props> = ({ bodies, isLoading, suppression = null }) => {
  const t = useI18n();

  if (suppression !== null) {
    return <StateNote text={t(SUPPRESSION_REASON_KEY[suppression])} />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded border border-primary bg-layer-3 p-3">
        <DialLoader size={LOADER_SIZE} ariaLabel={t(ConversationsTraceI18nKey.SpanTextsLoading)} />
      </div>
    );
  }

  if (!bodies || bodies.state === HopTextsState.ColumnsUnavailable) {
    return null;
  }

  // A failure is not the same as a hop that recorded nothing, so it is not reported in the same quiet grey.
  if (bodies.state === HopTextsState.LoadFailed) {
    return (
      <DialNotification
        variant={NotificationVariant.Error}
        message={t(ConversationsTraceI18nKey.SpanTextsLoadFailed)}
        textClassName="dial-tiny-text"
      />
    );
  }

  if (bodies.state !== HopTextsState.Available) {
    return <StateNote text={t(ConversationsTraceI18nKey.SpanTextsNone)} />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded border border-primary bg-layer-3 p-3">
      {bodies.sent !== null && <TextBlock label={t(ConversationsTraceI18nKey.SpanSent)} text={bodies.sent} />}
      {bodies.received !== null && (
        <TextBlock label={t(ConversationsTraceI18nKey.SpanReceived)} text={bodies.received} />
      )}
      {bodies.toolCalls.length > 0 && (
        <TextBlock label={t(ConversationsTraceI18nKey.SpanToolCalls)} text={bodies.toolCalls.join('\n')} />
      )}
    </div>
  );
};

export default ConversationHopTexts;
