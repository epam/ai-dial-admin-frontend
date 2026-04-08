import { DialFormPopup, DialInput, PopupSize } from '@epam/ai-dial-ui-kit';
import { FC, useCallback, useMemo, useState } from 'react';

import { ActionMenuOperationI18nKey, ButtonsI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
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

// TODO: remove after support FilesManager in all places with folders
const RenameFolder: FC<Props> = ({ currentPath, siblings = [], isModalOpen, onClose, onApply }) => {
  const t = useI18n();
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
    <DialFormPopup
      onClose={onClose}
      header={t(ActionMenuOperationI18nKey.Rename)}
      portalId="FolderRename"
      open={isModalOpen}
      dividers={true}
      size={PopupSize.Sm}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Apply)}
      onSubmit={() => onApply(changeFolderName(currentPath || '', newName))}
      onCancel={onClose}
      disableSubmitButton={isDisabled}
    >
      <div className="px-6 py-4">
        <DialInput
          id="folderName"
          labelProps={{ label: t(FoldersI18nKey.FolderName) }}
          placeholder={t(FoldersI18nKey.FolderCreatePlaceholder)}
          value={newName}
          onChange={onChangeName}
          error={errorText}
          invalid={!!errorText}
        />
      </div>
    </DialFormPopup>
  );
};

export default RenameFolder;
