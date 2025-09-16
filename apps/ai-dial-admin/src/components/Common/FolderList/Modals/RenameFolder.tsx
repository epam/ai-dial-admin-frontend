import { FC, useCallback, useMemo, useState } from 'react';

import Button from '@/src/components/Common/Button/Button';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';
import { getFolderName } from '@/src/utils/files/folder';
import { changeFolderName } from '@/src/utils/files/path';

interface Props {
  currentPath?: string;
  siblings?: string[];
  modalState: PopUpState;
  onClose: () => void;
  onApply: (name: string) => void;
}

const RenameFolder: FC<Props> = ({ currentPath, siblings = [], modalState, onClose, onApply }) => {
  const t = useI18n();
  const [newName, setNewName] = useState('');
  const [isDisabled, setIsDisabled] = useState(true);
  const [errorText, setErrorText] = useState('');

  const existingNames = useMemo(
    () => [...siblings, currentPath].map((folder) => getFolderName(folder || '')),
    [currentPath, siblings],
  );

  const onChangeName = useCallback(
    (value?: string) => {
      const error = existingNames.includes(value) ? t(FoldersI18nKey.RenameFolderError) : '';

      setNewName(value || '');
      setIsDisabled(!value?.length || !!error);
      setErrorText(error);
    },
    [existingNames, t],
  );

  return (
    <Popup
      onClose={onClose}
      heading={t(FoldersI18nKey.Rename)}
      portalId="FolderRename"
      state={modalState}
      dividers={true}
    >
      <div className="px-6 py-4">
        <TextInputField
          elementId="folderName"
          fieldTitle={t(FoldersI18nKey.FolderName)}
          placeholder={t(FoldersI18nKey.FolderCreatePlaceholder)}
          value={newName}
          onChange={onChangeName}
          errorText={errorText}
          invalid={!!errorText}
        />
      </div>

      <div className="flex flex-row justify-end w-full gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Apply)}
          onClick={() => onApply(changeFolderName(currentPath || '', newName))}
          disable={isDisabled}
        />
      </div>
    </Popup>
  );
};

export default RenameFolder;
