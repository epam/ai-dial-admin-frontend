import { FC, useMemo } from 'react';
import { ButtonVariant, DialButton, DialPopup } from '@epam/ai-dial-ui-kit';

import FolderList from '@/src/components/Common/FolderList/FolderList';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { AssetApp } from '@/src/models/dial/deployment-asset';
import { DialFile } from '@/src/models/dial/file';
import { DialFolder } from '@/src/models/dial/folder';
import { DialPrompt } from '@/src/models/dial/prompt';
import { checkPaths, checkSelectedPath, removeTrailingSlash } from '@/src/utils/files/path';

interface Props {
  isModalOpen: boolean;
  modalTitle: string;
  initialPath?: string;
  onClose: () => void;
  onApply: (filePath: string) => void;
  context?: () => AssetsFolderContext<DialFile | DialPrompt | AssetApp>;
  isFolderMove?: boolean;
}

const FilePathModal: FC<Props> = ({
  isModalOpen,
  modalTitle,
  initialPath,
  onClose,
  onApply,
  context,
  isFolderMove,
}) => {
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
    <DialPopup
      onClose={onClose}
      title={modalTitle}
      portalId="SelectFile"
      open={isModalOpen}
      cssClass="h-[750px]"
      footer={
        <div className="flex flex-row items-center justify-end gap-2 px-6 py-4">
          <DialButton variant={ButtonVariant.Secondary} title={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
          <DialButton
            variant={ButtonVariant.Primary}
            title={t(ButtonsI18nKey.Apply)}
            onClick={() => {
              onApply(removeTrailingSlash(folderContext?.filePath));
              onClose();
            }}
            disable={disable}
          />
        </div>
      }
    >
      <div className="flex px-6 py-4 h-full">
        <FolderList context={context} isFolderMove={isFolderMove} folderPath={initialPath} />
      </div>
    </DialPopup>
  );
};

export default FilePathModal;
