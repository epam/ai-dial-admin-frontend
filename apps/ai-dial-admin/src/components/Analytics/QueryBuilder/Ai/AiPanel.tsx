'use client';

import { FC, useState } from 'react';

import { ButtonAppearance, ButtonVariant, DialButton, DialPrimaryButton, DialTextarea } from '@epam/ai-dial-ui-kit';
import { IconSparkles } from '@tabler/icons-react';

import CopyButton from '@/src/components/Common/CopyButton/CopyButton';
import { extractSql } from '@/src/components/Analytics/QueryBuilder/utils/extract-sql';
import { generateQuery } from '@/src/app/[lang]/query-builder/actions';
import { QUERY_ASSISTANT_SUGGESTIONS } from '@/src/constants/analytics/query-assistant';
import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { QueryAssistantMessage, QueryAssistantRole } from '@/src/models/analytics/query-assistant';
import { getErrorNotification } from '@/src/utils/notification';

interface Props {
  onGenerated: (sql: string | null) => void;
}

const AiPanel: FC<Props> = ({ onGenerated }) => {
  const t = useI18n();
  const { showNotification } = useNotification();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<QueryAssistantMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [proposedSql, setProposedSql] = useState<string | null>(null);
  const [rawReply, setRawReply] = useState<string | null>(null);

  const onGenerate = async () => {
    const prompt = input.trim();
    if (!prompt || loading) {
      return;
    }
    const nextMessages: QueryAssistantMessage[] = [...messages, { role: QueryAssistantRole.User, content: prompt }];
    setLoading(true);
    const res = await generateQuery(nextMessages);
    if (res.success && res.response) {
      const reply = res.response.choices?.[0]?.message;
      const content = reply?.content ?? '';
      setMessages(reply ? [...nextMessages, reply] : nextMessages);
      const sql = extractSql(content);
      setProposedSql(sql);
      setRawReply(sql ? null : content);
      onGenerated(sql);
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

  const generateDisabled = !input.trim() || loading;

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto">
      <div className="flex items-center gap-2 text-accent-primary">
        <IconSparkles size={18} stroke={2} />
        <h2 className="dial-h6">{t(QueryBuilderI18nKey.AiPanelHeading)}</h2>
      </div>
      <p className="dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.AiPanelDescription)}</p>

      <DialTextarea
        id="query-assistant-prompt"
        aria-label={t(QueryBuilderI18nKey.AiPanelHeading)}
        placeholder={t(QueryBuilderI18nKey.AiPromptPlaceholder)}
        value={input}
        onChange={setInput}
        disabled={loading}
        rows={3}
      />

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

      <div>
        <DialPrimaryButton
          label={loading ? t(QueryBuilderI18nKey.AiGenerating) : t(QueryBuilderI18nKey.AiGenerate)}
          iconBefore={<IconSparkles size={18} stroke={2} />}
          onClick={onGenerate}
          disabled={generateDisabled}
        />
      </div>

      {proposedSql !== null && (
        <div className="flex min-h-0 flex-col gap-2 border-t border-primary pt-3">
          <div className="flex items-center justify-between">
            <span className="dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.AiProposedQuery)}</span>
            <CopyButton value={proposedSql} valueLabel={t(QueryBuilderI18nKey.SqlQuery)} />
          </div>
          <pre className="dial-small-text overflow-x-auto whitespace-pre-wrap rounded border border-primary bg-layer-3 p-3">
            {proposedSql}
          </pre>
          <span className="dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.AiRunHint)}</span>
        </div>
      )}

      {rawReply !== null && (
        <div className="flex flex-col gap-2 border-t border-primary pt-3">
          <span className="dial-tiny-text text-secondary">{t(QueryBuilderI18nKey.AiResponseLabel)}</span>
          <p className="dial-small-text whitespace-pre-wrap text-primary">{rawReply}</p>
        </div>
      )}
    </div>
  );
};

export default AiPanel;
