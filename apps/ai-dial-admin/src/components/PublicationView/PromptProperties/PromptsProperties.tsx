import classNames from 'classnames';
import { FC, ReactNode, useCallback, useState } from 'react';

import { IconChevronDown, IconChevronRight, IconExternalLink } from '@tabler/icons-react';

import Button from '@/src/components/Common/Button/Button';
import LabeledText from '@/src/components/Common/LabeledText/LabeledText';
import Tooltip from '@/src/components/Common/Tooltip/Tooltip';
import { EntityFieldsI18nKey, PublicationsI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ActionType } from '@/src/models/dial/publications';
import { ApplicationRoute } from '@/src/types/routes';
import { onOpenInNewTab } from '@/src/utils/open-in-new-tab';

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
  const [isCollapsed, setIsCollapsed] = useState(collapsed);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const openPrompt = useCallback(() => {
    onOpenInNewTab(ApplicationRoute.Prompts, prompt);
  }, [prompt]);

  return (
    <div className="flex flex-col bg-layer-3 p-4">
      <div className="flex flex-row justify-between">
        <button className={'flex items-center'} onClick={toggleCollapse}>
          <i className="text-icon-secondary">
            {isCollapsed ? <IconChevronRight {...BASE_ICON_PROPS} /> : <IconChevronDown {...BASE_ICON_PROPS} />}
          </i>
          <h3 className="mx-2">{prompt.name}</h3>
        </button>

        <div className="flex justify-end gap-4">
          {action === ActionType.DELETE && (
            <Button
              cssClass="secondary"
              title={t(PublicationsI18nKey.OpenPrompt)}
              iconBefore={<IconExternalLink {...BASE_ICON_PROPS} />}
              onClick={openPrompt}
            />
          )}
        </div>
      </div>
      <div className={classNames('flex flex-col h-full justify-between', isCollapsed && 'hidden')}>
        <div className="mt-4">
          <LabeledText label={t(EntityFieldsI18nKey.displayVersion)} text={prompt.version as string} />
        </div>
        <div className="mt-4">
          <LabeledText label={t(EntityFieldsI18nKey.description)} text={prompt.description as string} />
        </div>
        <div className="mt-4">
          <LabeledText label={t(EntityFieldsI18nKey.content)}>
            <Tooltip
              contentClassName="truncate"
              tooltip={formatPromptText(prompt.content as string)}
              placement={'bottom-start'}
            >
              <p className="break-words">{formatPromptText(prompt.content as string)}</p>
            </Tooltip>
          </LabeledText>
        </div>
      </div>
    </div>
  );
};
export default PromptsProperties;
