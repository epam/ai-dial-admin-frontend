import { DialFormPopup } from '@epam/ai-dial-ui-kit';
import { FC, useMemo } from 'react';

import FolderList from '@/src/components/Common/FolderList/FolderList';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFolder } from '@/src/models/dial/folder';
import { checkPaths, checkSelectedPath, removeTrailingSlash } from '@/src/utils/files/path';

interface Props {
  isModalOpen: boolean;
  modalTitle: string;
  initialPath?: string;
  onClose: () => void;
  onApply: (filePath: string) => void;
  context?: () => AssetsFolderContext;
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
    <DialFormPopup
      onClose={onClose}
      header={modalTitle}
      portalId="SelectFile"
      open={isModalOpen}
      className="h-[750px]"
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      submitLabel={t(ButtonsI18nKey.Apply)}
      onSubmit={() => {
        onApply(removeTrailingSlash(folderContext?.filePath));
        onClose();
      }}
      onCancel={onClose}
      disableSubmitButton={disable}
    >
      <div className="flex px-6 py-4 h-full">
        <FolderList context={context} isFolderMove={isFolderMove} folderPath={initialPath} />
      </div>
    </DialFormPopup>
  );
};

export default FilePathModal;
