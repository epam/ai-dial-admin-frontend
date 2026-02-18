import { FC, useMemo } from 'react';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';
import { IconTrashX } from '@tabler/icons-react';

import PromptProperties from '@/src/components/Assets/Prompts/View/Properties';
import Accordion from '@/src/components/Common/Accordion/Accordion';
import EditableTitle from '@/src/components/Common/EditableTitle/EditableTitle';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { DialPrompt } from '@/src/models/dial/prompt';

interface HeaderProps {
  isCollapsed: boolean;
  promptName?: string;
  changeName: (name: string) => void;
  remove: () => void;
}

const PromptHeader: FC<HeaderProps> = ({ isCollapsed, promptName, changeName, remove }) => {
  const t = useI18n();

  return (
    <div className="flex items-center justify-between gap-4 ml-1 w-full h-[38px]">
      <EditableTitle size={3} title={promptName || ''} changeTitle={changeName} disabled={isCollapsed} />
      {!isCollapsed && (
        <DialNeutralButton
          label={t(ButtonsI18nKey.Delete)}
          iconBefore={<IconTrashX {...BASE_BUTTON_ICON_PROPS} />}
          onClick={(e) => {
            e.stopPropagation();
            remove();
          }}
        />
      )}
    </div>
  );
};

interface Props {
  prompt: DialPrompt;
  onChange: (updatedPrompt: DialPrompt) => void;
  onRemove: () => void;
}

const PromptDetails: FC<Props> = ({ prompt, onChange, onRemove }) => {
  const header = useMemo(() => {
    return (
      <PromptHeader
        promptName={prompt.name}
        changeName={(name) => onChange({ ...prompt, name })}
        remove={onRemove}
        isCollapsed={false}
      />
    );
  }, [prompt, onRemove, onChange]);

  return (
    <Accordion contentClassName="h-full justify-between" header={header}>
      <PromptProperties prompt={prompt} onChangePrompt={onChange} isPublication />
    </Accordion>
  );
};
export default PromptDetails;
