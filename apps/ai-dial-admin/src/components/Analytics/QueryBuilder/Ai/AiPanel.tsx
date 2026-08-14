'use client';

import { FC, useEffect, useRef, useState } from 'react';

import {
  ButtonAppearance,
  ButtonVariant,
  DialButton,
  DialPrimaryButton,
  DialTextarea,
  ElementSize,
} from '@epam/ai-dial-ui-kit';
import { IconPlayerPlay, IconSparkles } from '@tabler/icons-react';
import classNames from 'classnames';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { splitMessageAroundSql } from '@/src/components/Analytics/QueryBuilder/utils/extract-sql';
import { generateQuery } from '@/src/app/[lang]/queries/actions';
import { useQueryBuilder } from '@/src/components/Analytics/QueryBuilder/context';
import { buildSchemaSystemMessage } from '@/src/components/Analytics/QueryBuilder/utils/ai-context';
import { QUERY_ASSISTANT_SUGGESTIONS } from '@/src/constants/analytics/query-assistant';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { QueryAssistantMessage, QueryAssistantRole } from '@/src/models/analytics/query-assistant';
import { getErrorNotification } from '@/src/utils/notification';

interface Props {
  onRunMessage: (sql: string, messageIndex: number) => void;
  loadedMessageIndex: number | null;
  runInFlight: boolean;
}

const AiPanel: FC<Props> = ({ onRunMessage, loadedMessageIndex, runInFlight }) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  // The selected source and its schema come from the builder context, the same place every other
  // section reads them from, so the assistant cannot fall out of step with the toolbar.
  const { state } = useQueryBuilder();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<QueryAssistantMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const lastUserMessageRef = useRef<HTMLDivElement | null>(null);

  // Scrolls the latest user message to the top of the transcript, so the question that was just asked
  // stays visible together with its reply instead of the view jumping straight to the transcript's end.
  useEffect(() => {
    lastUserMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [messages]);

  const onSend = async () => {
    const prompt = input.trim();
    if (!prompt || loading) {
      return;
    }
    const nextMessages: QueryAssistantMessage[] = [...messages, { role: QueryAssistantRole.User, content: prompt }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);
    // The schema message is built per request and kept out of `messages`, so it never shows in the
    // transcript and always describes the source selected *now* — switching source mid-conversation
    // makes the next request carry the new schema.
    const res = await generateQuery([buildSchemaSystemMessage(state.entityName, state.fields), ...nextMessages]);
    if (res.success && res.response) {
      const reply = res.response.choices?.[0]?.message;
      if (reply) {
        setMessages([...nextMessages, reply]);
      }
    } else {
      showNotification(
        getErrorNotification(
          res.errorHeader || t(QueryBuilderI18nKey.AiGenerateFailed),
          res.errorMessage,
          res.requestId,
        ),
      );
    }
    setLoading(false);
  };

  const sendDisabled = !input.trim() || loading;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center gap-2 text-accent-primary">
        <IconSparkles size={18} stroke={2} />
        <h2 className="dial-h6">{t(QueryBuilderI18nKey.AiPanelHeading)}</h2>
      </div>
      <p className="dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.AiPanelDescription)}</p>

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {messages.map((message, index) => {
          const isUser = message.role === QueryAssistantRole.User;
          const split = isUser ? null : splitMessageAroundSql(message.content);
          const isLoaded = index === loadedMessageIndex;
          const isLastUserMessage =
            isUser && !messages.slice(index + 1).some((m) => m.role === QueryAssistantRole.User);
          return (
            <div
              key={index}
              ref={isLastUserMessage ? lastUserMessageRef : undefined}
              className={classNames(
                'flex max-w-[92%] flex-col gap-2 rounded border p-3',
                isUser ? 'self-end border-transparent bg-layer-3' : 'self-start border-primary bg-layer-1',
              )}
            >
              {split === null ? (
                <p className="dial-small-text whitespace-pre-wrap text-primary">{message.content}</p>
              ) : (
                <>
                  {split.before && <p className="dial-small-text whitespace-pre-wrap text-primary">{split.before}</p>}
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.SqlQuery)}</span>
                      <div className="flex items-center gap-1">
                        <CopyButton
                          value={split.sql}
                          valueLabel={t(QueryBuilderI18nKey.SqlQuery)}
                          size={ElementSize.Small}
                        />
                        <DialButton
                          label={t(QueryBuilderI18nKey.Run)}
                          iconBefore={<IconPlayerPlay size={14} stroke={2} />}
                          appearance={ButtonAppearance.Outlined}
                          variant={ButtonVariant.Secondary}
                          size={ElementSize.Small}
                          onClick={() => onRunMessage(split.sql, index)}
                          disabled={runInFlight || isLoaded}
                        />
                      </div>
                    </div>
                    <pre className="dial-small-text overflow-x-auto whitespace-pre-wrap rounded border border-primary bg-layer-3 p-2">
                      {split.sql}
                    </pre>
                  </div>
                  {split.after && <p className="dial-small-text whitespace-pre-wrap text-primary">{split.after}</p>}
                </>
              )}
            </div>
          );
        })}
      </div>

      {messages.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {QUERY_ASSISTANT_SUGGESTIONS.map((key) => (
            <DialButton
              key={key}
              label={t(key)}
              appearance={ButtonAppearance.Ghost}
              variant={ButtonVariant.Secondary}
              onClick={() => setInput(t(key))}
              disabled={loading}
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <DialTextarea
          id="query-assistant-prompt"
          aria-label={t(QueryBuilderI18nKey.AiPanelHeading)}
          placeholder={t(QueryBuilderI18nKey.AiPromptPlaceholder)}
          value={input}
          onChange={setInput}
          disabled={loading}
          rows={3}
        />
        <div className="flex justify-end">
          <DialPrimaryButton
            label={loading ? t(QueryBuilderI18nKey.AiSending) : t(QueryBuilderI18nKey.AiSend)}
            iconBefore={<IconSparkles size={18} stroke={2} />}
            onClick={onSend}
            disabled={sendDisabled}
          />
        </div>
      </div>
    </div>
  );
};

export default AiPanel;
