'use client';

import { FC, KeyboardEvent } from 'react';

import { ElementSize, PrimaryIconButton, Spinner, Textarea } from '@epam/ai-dial-ui-kit';
import { IconArrowRight } from '@tabler/icons-react';

import { QueryBuilderI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  value: string;
  isSending: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
}

const LOADER_SIZE = 18;

const AiPromptInput: FC<Props> = ({ value, isSending, onChange, onSend }) => {
  const t = useI18n();
  const isSendDisabled = !value.trim() || isSending;

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (!isSendDisabled) onSend();
  };

  return (
    <div className="relative shrink-0">
      <Textarea
        id="query-assistant-prompt"
        aria-label={t(QueryBuilderI18nKey.AskAi)}
        placeholder={t(QueryBuilderI18nKey.AiPromptPlaceholder)}
        className="h-auto max-h-80 min-h-24 pr-12 [field-sizing:content]"
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        disabled={isSending}
        rows={1}
      />
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        {isSending && <Spinner size={LOADER_SIZE} fullWidth={false} ariaLabel={t(QueryBuilderI18nKey.AiSending)} />}
        <PrimaryIconButton
          size={ElementSize.Small}
          aria-label={t(QueryBuilderI18nKey.AiSend)}
          icon={<IconArrowRight size={18} aria-hidden />}
          onClick={onSend}
          disabled={isSendDisabled}
        />
      </div>
    </div>
  );
};

export default AiPromptInput;
