import { FC, useMemo } from 'react';

import Button from '@/src/components/Common/Button/Button';
import FolderList from '@/src/components/Common/FolderList/FolderList';
import Popup from '@/src/components/Common/Popup/Popup';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialAssetApp } from '@/src/models/dial/asset-app';
import { DialFile } from '@/src/models/dial/file';
import { DialFolder } from '@/src/models/dial/folder';
import { DialPrompt } from '@/src/models/dial/prompt';
import { PopUpState } from '@/src/types/pop-up';
import { checkPaths, checkSelectedPath, removeTrailingSlash } from '@/src/utils/files/path';

interface Props {
  modalState: PopUpState;
  modalTitle: string;
  initialPath?: string;
  onClose: () => void;
  onApply: (filePath: string) => void;
  context?: () => AssetsFolderContext<DialFile | DialPrompt | DialAssetApp>;
  isFolderMove?: boolean;
}

const FilePathModal: FC<Props> = ({ modalState, modalTitle, initialPath, onClose, onApply, context, isFolderMove }) => {
  const t = useI18n();
  const folderContext = context?.();

  const disable = useMemo(() => {
    return isFolderMove
      ? checkSelectedPath(
          initialPath as string,
          folderContext?.filePath as string,
          folderContext?.files as DialFolder[],
        )
      : checkPaths(initialPath, folderContext?.filePath);
  }, [folderContext?.filePath, folderContext?.files, initialPath, isFolderMove]);

  return (
    <Popup
      onClose={onClose}
      heading={modalTitle}
      portalId="SelectFile"
      state={modalState}
      containerClassName={'h-[750px]'}
    >
      <div className="flex px-6 py-4 flex-1 min-h-0">
        <FolderList context={context} isFolderMove={isFolderMove} folderPath={initialPath} />
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
