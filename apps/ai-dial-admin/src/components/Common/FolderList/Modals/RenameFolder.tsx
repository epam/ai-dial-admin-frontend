import { FC, useCallback, useMemo, useState } from 'react';
import { ButtonVariant, DialButton, DialPopup, DialTextInputField } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { getFolderName } from '@/src/utils/files/folder';
import { changeFolderName } from '@/src/utils/files/path';
import { getErrorForFolderName } from '@/src/utils/validation/folder-error';

interface Props {
  currentPath: string;
  siblings?: string[];
  isModalOpen: boolean;
  onClose: () => void;
  onApply: (name: string) => void;
}

const RenameFolder: FC<Props> = ({ currentPath, siblings = [], isModalOpen, onClose, onApply }) => {
  const t = useI18n() as (str: string) => string;
  const [newName, setNewName] = useState(getFolderName(currentPath) || '');
  const [isDisabled, setIsDisabled] = useState(true);
  const [errorText, setErrorText] = useState('');

  const existingNames = useMemo(
    () => [...siblings, currentPath].map((folder) => getFolderName(folder)),
    [currentPath, siblings],
  );

  const onChangeName = useCallback(
    (value?: string) => {
      const error = getErrorForFolderName(value, existingNames, t, true);

      setNewName(value || '');
      setIsDisabled(!value?.length || !!error);
      setErrorText(error?.text || '');
    },
    [existingNames, t],
  );

  return (
    <DialPopup
      onClose={onClose}
      title={t(FoldersI18nKey.Rename)}
      portalId="FolderRename"
      open={isModalOpen}
      dividers={true}
      footer={
        <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
          <DialButton variant={ButtonVariant.Secondary} title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
          <DialButton
            variant={ButtonVariant.Primary}
            title={t(ButtonsI18nKey.Apply)}
            onClick={() => onApply(changeFolderName(currentPath || '', newName))}
            disable={isDisabled}
          />
        </div>
      }
    >
      <div className="px-6 py-4">
        <DialTextInputField
          elementId="folderName"
          fieldTitle={t(FoldersI18nKey.FolderName)}
          placeholder={t(FoldersI18nKey.FolderCreatePlaceholder)}
          value={newName}
          onChange={onChangeName}
          errorText={errorText}
          invalid={!!errorText}
        />
      </div>
    </DialPopup>
  );
};

export default RenameFolder;
