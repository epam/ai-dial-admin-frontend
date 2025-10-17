import { DialFormPopup, DialRadioGroup, RadioButtonWithContent, RadioGroupOrientation } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useEffect, useState } from 'react';

import FilePath from '@/src/components/Common/FilePath/FilePath';
import DisplayNameControl from '@/src/components/EntityMainProperties/BaseProperties/DisplayName';
import VersionControl from '@/src/components/EntityMainProperties/BaseProperties/Version';
import {
  BasicI18nKey,
  ButtonsI18nKey,
  EntityPlaceholdersI18nKey,
  FoldersI18nKey,
  PromptsI18nKey,
} from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { usePromptFolder } from '@/src/context/assets/PromptFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { DuplicationTypes } from '@/src/types/prompt';
import { checkNameVersionCombination, getInitialVersion } from '@/src/utils/prompts/versions';
import { ApplicationRoute } from '@/src/types/routes';
import { getClonedEntityName, getCloneTitle } from '@/src/utils/entities/duplicate-entity';

interface Props {
  isModalOpen: boolean;
  entity: DialPrompt;
  versionsMap: Record<string, string[]>;
  onClose: () => void;
  onDuplicate: (entity: DialPrompt) => void;
}

const DuplicatePrompt: FC<Props> = ({ isModalOpen, entity, versionsMap, onDuplicate, onClose }) => {
  const t = useI18n() as (t: string, props?: Record<string, string>) => string;
  const initialName = entity.name;
  const initialFolder = entity.folderId;
  const [duplicationType, setDuplicationType] = useState<string>(DuplicationTypes.VERSION);

  const duplicationTypes: RadioButtonWithContent[] = [
    { id: DuplicationTypes.VERSION, name: t(PromptsI18nKey.NewVersion) },
    { id: DuplicationTypes.PROMPT, name: t(PromptsI18nKey.NewPrompt) },
  ];

  const [clonedPrompt, setClonedPrompt] = useState<DialPrompt>({
    ...entity,
    name: getClonedEntityName(entity.name),
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
    <DialFormPopup
      onClose={onClose}
      title={t(getCloneTitle(ApplicationRoute.Prompts, t))}
      portalId="DuplicatePrompt"
      open={isModalOpen}
      onSubmit={() => onDuplicate(clonedPrompt)}
      onCancel={onClose}
      disableSubmitButton={!isValid}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Duplicate)}
    >
      <div className="flex flex-col px-6 py-4 gap-4">
        <DialRadioGroup
          radioButtons={duplicationTypes}
          activeRadioButton={duplicationType}
          elementId="duplicationTypes"
          fieldTitle={t(PromptsI18nKey.DuplicationType)}
          orientation={RadioGroupOrientation.Column}
          onChange={onChangeDuplicationType}
        />
        <DisplayNameControl
          displayName={clonedPrompt.name}
          onChange={onChangeName}
          disabled={duplicationType === DuplicationTypes.VERSION}
          required={true}
        />
        <VersionControl version={clonedPrompt.version} onChange={onChangeVersion} />

        {duplicationType === DuplicationTypes.PROMPT && (
          <FilePath
            value={clonedPrompt.folderId}
            label={t(FoldersI18nKey.Storage)}
            modalTitle={t(BasicI18nKey.MoveToFolder)}
            placeholder={t(EntityPlaceholdersI18nKey.Path)}
            onChange={onChangePath}
            context={usePromptFolder as () => AssetsFolderContext<DialPrompt | DialFile>}
          />
        )}
      </div>
    </DialFormPopup>
  );
};

export default DuplicatePrompt;
