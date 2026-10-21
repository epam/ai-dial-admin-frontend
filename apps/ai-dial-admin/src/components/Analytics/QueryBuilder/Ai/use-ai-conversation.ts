'use client';

import { useRef, useState } from 'react';

import { generateQuery } from '@/src/app/[lang]/queries/actions';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { QueryAssistantMessage, QueryAssistantRole } from '@/src/models/analytics/query-assistant';
import { getErrorNotification } from '@/src/utils/notification';

// Held by the page rather than the AI panel: the panel unmounts whenever the rail shows another view or
// collapses, and a transcript owned by it would vanish while the page still marks one of its messages
// as the loaded query.
export const useAiConversation = () => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [messages, setMessages] = useState<QueryAssistantMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  // Bumped by `reset`, so a reply still in flight from a cleared conversation is dropped instead of
  // landing in the next one.
  const generation = useRef(0);

  const send = async (prompt: string) => {
    const sentIn = generation.current;
    const nextMessages: QueryAssistantMessage[] = [...messages, { role: QueryAssistantRole.User, content: prompt }];
    setMessages(nextMessages);
    setIsSending(true);
    const notifyFailed = (header?: string, message?: string, requestId?: string) =>
      showNotification(getErrorNotification(header || t(QueryBuilderI18nKey.AiGenerateFailed), message, requestId));
    try {
      // The transcript is sent verbatim: the assistant deployment owns its system prompt and resolves any
      // schema it needs through its own tools, so the page adds no message of its own.
      const res = await generateQuery(nextMessages);
      if (sentIn !== generation.current) {
        return;
      }
      if (res.success && res.response) {
        const reply = res.response.choices?.[0]?.message;
        if (reply) {
          setMessages([...nextMessages, reply]);
        }
      } else {
        notifyFailed(res.errorHeader, res.errorMessage, res.requestId);
      }
    } catch {
      if (sentIn === generation.current) {
        notifyFailed();
      }
    } finally {
      // The flag belongs to the conversation the reply was for; a newer one manages its own.
      if (sentIn === generation.current) {
        setIsSending(false);
      }
    }
  };

  const reset = () => {
    generation.current += 1;
    setMessages([]);
    setIsSending(false);
  };

  return { messages, isSending, send, reset };
};
