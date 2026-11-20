import { FC, useMemo } from 'react';

import RemoveButton from '@/src/components/Common/RemoveButton/RemoveButton';
import PromptProperties from '@/src/components/Assets/Artifacts/Prompts/View/Properties';
import Accordion from '@/src/components/Common/Accordion/Accordion';
import EditableTitle from '@/src/components/Common/EditableTitle/EditableTitle';
import { ButtonsI18nKey } from '@/src/constants/i18n';
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
        <RemoveButton
          label={t(ButtonsI18nKey.Delete)}
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
