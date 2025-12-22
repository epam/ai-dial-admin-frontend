import { FC, ReactNode, useCallback, useMemo } from 'react';
import { IconExternalLink } from '@tabler/icons-react';
import { ButtonVariant, DialButton, DialTooltip } from '@epam/ai-dial-ui-kit';

import { EntityFieldsI18nKey, PublicationsI18nKey } from '@/src/constants/i18n';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ActionType } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

import LabelledText from '@/src/components/Common/LabelledText/LabelledText';
import Accordion from '@/src/components/Common/Accordion/Accordion';

function formatPromptText(input?: string): ReactNode {
  const parts = input?.split(/({{.*?}})/) || [];
  return parts.map((part, index) => {
    if (part.startsWith('{{') && part.endsWith('}}')) {
      return (
        <span key={index} className="text-accent-tertiary">
          {part}
        </span>
      );
    }
    return part;
  });
}

interface Props {
  prompt: Partial<DialPrompt>;
  action: ActionType;
  collapsed: boolean;
}

const PromptsProperties: FC<Props> = ({ prompt, action, collapsed }) => {
  const t = useI18n();

  const openPrompt = useCallback(() => {
    onOpenInNewTab(ApplicationRoute.Prompts, prompt);
  }, [prompt]);

  const actionButtons = useMemo(() => {
    return (
      <div className="flex justify-end gap-4">
        {action === ActionType.DELETE && (
          <DialButton
            variant={ButtonVariant.Secondary}
            label={t(PublicationsI18nKey.OpenPrompt)}
            iconBefore={<IconExternalLink {...BASE_ICON_PROPS} />}
            onClick={openPrompt}
          />
        )}
      </div>
    );
  }, [action, openPrompt, t]);

  return (
    <Accordion
      title={prompt.name ?? ''}
      containerClassName="bg-layer-3"
      contentClassName="h-full justify-between"
      actionButtons={actionButtons}
      collapsed={collapsed}
    >
      <div className="mt-4">
        <LabelledText label={t(EntityFieldsI18nKey.displayVersion)} text={prompt.version as string} />
      </div>
      <div className="mt-4">
        <LabelledText label={t(EntityFieldsI18nKey.description)} text={prompt.description as string} />
      </div>
      <div className="mt-4">
        <LabelledText label={t(EntityFieldsI18nKey.content)}>
          <DialTooltip
            contentClassName="truncate"
            tooltip={formatPromptText(prompt.content as string)}
            placement="bottom-start"
          >
            <p className="break-words">{formatPromptText(prompt.content as string)}</p>
          </DialTooltip>
        </LabelledText>
      </div>
    </Accordion>
  );
};
export default PromptsProperties;
