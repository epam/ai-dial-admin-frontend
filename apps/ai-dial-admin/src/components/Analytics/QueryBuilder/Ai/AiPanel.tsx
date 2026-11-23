'use client';

import { FC, useEffect, useRef, useState } from 'react';

import { NoDataContent } from '@epam/ai-dial-ui-kit';

import EmptyIllustration from '@/public/images/ai-query-empty.svg';

import AssistantMessageText from '@/src/components/Analytics/QueryBuilder/Ai/AssistantMessageText';
import AiPromptInput from '@/src/components/Analytics/QueryBuilder/Ai/AiPromptInput';
import { ProposedQueryStatus } from '@/src/components/Analytics/QueryBuilder/Ai/models';
import ProposedQueryActions from '@/src/components/Analytics/QueryBuilder/Ai/ProposedQueryActions';
import { useAiConversation } from '@/src/components/Analytics/QueryBuilder/Ai/use-ai-conversation';
import { splitMessageAroundSql } from '@/src/components/Analytics/QueryBuilder/utils/extract-sql';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { QueryAssistantRole } from '@/src/models/analytics/query-assistant';

interface Props {
  conversation: ReturnType<typeof useAiConversation>;
  onRunMessage: (sql: string, messageIndex: number) => void;
  loadedMessageIndex: number | null;
  messageStatuses: Record<number, ProposedQueryStatus>;
  onDismissMessage: (messageIndex: number) => void;
  runInFlight: boolean;
}

const AiPanel: FC<Props> = ({
  conversation,
  onRunMessage,
  loadedMessageIndex,
  messageStatuses,
  onDismissMessage,
  runInFlight,
}) => {
  const t = useI18n();
  const { messages, isSending } = conversation;

  const [input, setInput] = useState('');
  const lastUserMessageRef = useRef<HTMLDivElement | null>(null);

  // Scrolls the latest user message to the top of the transcript, so the question that was just asked
  // stays visible together with its reply instead of the view jumping straight to the transcript's end.
  useEffect(() => {
    lastUserMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [messages]);

  const onSend = async () => {
    const prompt = input.trim();
    if (!prompt || isSending) {
      return;
    }
    setInput('');
    await conversation.send(prompt);
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {messages.length === 0 ? (
        <NoDataContent
          className="min-h-0 flex-1"
          icon={<EmptyIllustration />}
          title={t(QueryBuilderI18nKey.AiEmptyTitle)}
          description={t(QueryBuilderI18nKey.AiEmptyDescription)}
        />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          {messages.map((message, index) => {
            const isUser = message.role === QueryAssistantRole.User;
            const isLastUserMessage =
              isUser && !messages.slice(index + 1).some((m) => m.role === QueryAssistantRole.User);

            if (isUser) {
              return (
                <div
                  key={index}
                  ref={isLastUserMessage ? lastUserMessageRef : undefined}
                  className="dial-small-text max-w-[85%] self-end whitespace-pre-wrap rounded border border-tertiary bg-layer-3 px-3 py-2 text-primary"
                >
                  {message.content}
                </div>
              );
            }

            const split = splitMessageAroundSql(message.content);
            if (split === null) {
              return <AssistantMessageText key={index} content={message.content} />;
            }

            const status = messageStatuses[index] ?? ProposedQueryStatus.Pending;

            return (
              <div key={index} className="flex flex-col gap-2">
                {split.before && <AssistantMessageText content={split.before} />}
                {split.after && <AssistantMessageText content={split.after} />}
                <ProposedQueryActions
                  status={status}
                  isApplyDisabled={runInFlight || index === loadedMessageIndex}
                  onApply={() => onRunMessage(split.sql, index)}
                  onDismiss={() => onDismissMessage(index)}
                />
              </div>
            );
          })}
        </div>
      )}

      <AiPromptInput value={input} isSending={isSending} onChange={setInput} onSend={onSend} />
    </div>
  );
};

export default AiPanel;
