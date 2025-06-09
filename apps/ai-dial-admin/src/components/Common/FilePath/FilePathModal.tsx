import { FC } from 'react';

import Button from '@/src/components/Common/Button/Button';
import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';
import FolderList from '@/src/components/Common/FolderList/FolderList';
import { PromptFolderContextType } from '@/src/context/PromptFolderContext';
import { checkPaths, removeTrailingSlash } from '@/src/utils/files/path';
import { FileFolderContextType } from '@/src/context/FileFolderContext';

interface Props {
  modalState: PopUpState;
  modalTitle: string;
  initialPath?: string;
  onClose: () => void;
  onApply: (filePath: string) => void;
  context?: () => PromptFolderContextType | FileFolderContextType;
}

const FilePathModal: FC<Props> = ({ modalState, modalTitle, initialPath, onClose, onApply, context }) => {
  const t = useI18n();
  const folderContext = context?.();

  const disable = checkPaths(initialPath, folderContext?.filePath);

  return (
    <Popup
      onClose={onClose}
      heading={modalTitle}
      portalId="SelectFile"
      state={modalState}
      containerClassName={'h-[750px]'}
    >
      <div className="flex px-6 py-4 flex-1 min-h-0">
        <FolderList context={context} />
      </div>
      <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
        <Button cssClass="secondary" title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
        <Button
          cssClass="primary"
          title={t(ButtonsI18nKey.Apply)}
          onClick={() => {
            onApply(removeTrailingSlash(folderContext?.filePath));
            onClose();
          }}
          disable={disable}
        />
      </div>
    </Popup>
  );
};

export default FilePathModal;
