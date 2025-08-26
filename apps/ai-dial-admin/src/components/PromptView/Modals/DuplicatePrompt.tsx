import { FC, useCallback, useEffect, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import FilePath from '@/src/components/Common/FilePath/FilePath';
import Popup from '@/src/components/Common/Popup/Popup';
import RadioField from '@/src/components/Common/RadioField/RadioField';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import VersionControl from '@/src/components/EntityMainProperties/BaseProperties/Version';
import {
  BasicI18nKey,
  ButtonsI18nKey,
  DuplicateI18nKey,
  EntityPlaceholdersI18nKey,
  FoldersI18nKey,
  PromptsI18nKey,
} from '@/src/constants/i18n';
import { usePromptFolder } from '@/src/context/PromptFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialPrompt } from '@/src/models/dial/prompt';
import { RadioButtonModel } from '@/src/models/radio-button';
import { PopUpState } from '@/src/types/pop-up';
import { DuplicationTypes } from '@/src/types/prompt';
import { RadioFieldOrientation } from '@/src/types/radio-orientation';
import { checkNameVersionCombination, getInitialVersion } from '@/src/utils/prompts/versions';

interface Props {
  modalState: PopUpState;
  entity: DialPrompt;
  versionsMap: Record<string, string[]>;
  onClose: () => void;
  onDuplicate: (entity: DialPrompt) => void;
}

const DuplicatePrompt: FC<Props> = ({ modalState, entity, versionsMap, onDuplicate, onClose }) => {
  const t = useI18n();
  const initialName = entity.name;
  const initialFolder = entity.folderId;
  const [duplicationType, setDuplicationType] = useState<string>(DuplicationTypes.VERSION);

  const duplicationTypes: RadioButtonModel[] = [
    { id: DuplicationTypes.VERSION, name: t(PromptsI18nKey.NewVersion) },
    { id: DuplicationTypes.PROMPT, name: t(PromptsI18nKey.NewPrompt) },
  ];

  const [clonedPrompt, setClonedPrompt] = useState<DialPrompt>({
    ...entity,
    version: getInitialVersion(versionsMap, entity?.name),
  });
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setIsValid(
      !!clonedPrompt.name &&
        !!clonedPrompt.version &&
        !checkNameVersionCombination(versionsMap, clonedPrompt.name, clonedPrompt.version),
    );
  }, [clonedPrompt, versionsMap]);

  const onChangeName = useCallback(
    (name?: string) => {
      setClonedPrompt({ ...clonedPrompt, name });
    },
    [setClonedPrompt, clonedPrompt],
  );

  const onChangeVersion = useCallback(
    (version?: string) => {
      setClonedPrompt({ ...clonedPrompt, version: version || '' });
    },
    [setClonedPrompt, clonedPrompt],
  );

  const onChangePath = useCallback(
    (folderId: string) => {
      setClonedPrompt({ ...clonedPrompt, folderId });
    },
    [setClonedPrompt, clonedPrompt],
  );

  const onChangeDuplicationType = useCallback(
    (type: string) => {
      setDuplicationType(type);
      if (type === DuplicationTypes.VERSION) {
        setClonedPrompt({ ...clonedPrompt, name: initialName });
      } else {
        setClonedPrompt({ ...clonedPrompt, folderId: initialFolder });
      }
    },
    [setDuplicationType, setClonedPrompt, initialName, initialFolder, clonedPrompt],
  );

  return (
    <Popup onClose={onClose} heading={t(DuplicateI18nKey.PromptHeader)} portalId="DuplicatePrompt" state={modalState}>
      <div className="flex flex-col px-6 py-4 gap-4">
        <RadioField
          radioButtons={duplicationTypes}
          activeRadioButton={duplicationType}
          elementId="duplicationTypes"
          fieldTitle={t(PromptsI18nKey.DuplicationType)}
          orientation={RadioFieldOrientation.Column}
          onChange={onChangeDuplicationType}
        />
        <DisplayNameControl
          displayName={clonedPrompt.name}
          onChange={onChangeName}
          disabled={duplicationType === DuplicationTypes.VERSION}
        />
        <VersionControl version={clonedPrompt.version} onChange={onChangeVersion} />

        {duplicationType === DuplicationTypes.PROMPT && (
          <FilePath
            value={clonedPrompt.folderId}
            label={t(FoldersI18nKey.Storage)}
            modalTitle={t(BasicI18nKey.MoveToFolder)}
            placeholder={t(EntityPlaceholdersI18nKey.Path)}
            onChange={onChangePath}
            context={usePromptFolder}
          />
        )}
      </div>
      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={() => onClose()} />

        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Duplicate)}
          disable={!isValid}
          onClick={() => onDuplicate(clonedPrompt)}
        />
      </div>
    </Popup>
  );
};

export default DuplicatePrompt;
