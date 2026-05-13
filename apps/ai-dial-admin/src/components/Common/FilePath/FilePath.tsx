import { FC, useCallback, useEffect, useState } from 'react';

import {
  DialDestinationFolderPopup,
  DialFile,
  DialInput,
  DialNeutralButton,
  DialUploadFileItem,
} from '@epam/ai-dial-ui-kit';
import { IconFolderShare } from '@tabler/icons-react';

import { ActionMenuOperationI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS, CONTROL_WITH_BUTTON_WIDTH } from '@/src/constants/main-layout';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useI18n } from '@/src/locales/client';
import { ROOT_FOLDER } from '@/src/constants/file';
import { ServerActionResponse } from '@/src/models/server-action';
import { getParentPathByFullPath } from '@/src/components/Assets/utils';
import { getFilePathGridOptions, processAssetsData } from './utils';
import { ApplicationRoute } from '@/src/types/routes';

interface Props {
  label: string;
  placeholder: string;
  modalTitle: string;
  disabled?: boolean;
  value?: string;
  onChange: (value: string) => void;
  context?: () => AssetsFolderContext;
  onCreateFolder?: (_: DialUploadFileItem | undefined, folderPath: string) => Promise<ServerActionResponse>;
  view?: ApplicationRoute;
}

const FilePath: FC<Props> = ({
  label,
  placeholder,
  disabled,
  value,
  modalTitle,
  onChange,
  context,
  onCreateFolder,
  view,
}) => {
  const t = useI18n();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { files, fetchFiles } = context?.() || {};
  const [loadedPaths, setLoadedPaths] = useState(new Set(['']));

  useEffect(() => {
    const rootPath = `${ROOT_FOLDER}/`;
    if (!loadedPaths.has(rootPath)) {
      fetchFiles?.(rootPath);
      setLoadedPaths((prev) => new Set(prev).add(rootPath));
    }
  }, [fetchFiles, loadedPaths]);

  useEffect(() => {}, [files]);

  const onInputChange = (value?: string) => {
    onChange(value || '');
  };

  const onOpenFilePathModal = useCallback(() => {
    setIsModalOpen(true);
  }, [setIsModalOpen]);

  const onCloseFilePathModal = useCallback(() => {
    setIsModalOpen(false);
  }, [setIsModalOpen]);

  const onDestinationFolderChange = useCallback(
    (path?: string) => {
      if (path && !loadedPaths.has(path)) {
        setLoadedPaths((prev) => new Set(prev).add(path));
        fetchFiles?.(path);
      }
      onChange?.(path || '');
    },
    [loadedPaths, onChange, fetchFiles],
  );

  const handleCreateFolder = useCallback(
    (_: DialUploadFileItem, folderPath: string) => {
      const parentPath = getParentPathByFullPath(folderPath) || `${ROOT_FOLDER}/`;
      const normalizedParentPath = parentPath.replaceAll('//', '/');
      onCreateFolder?.(_, folderPath).then((res) => {
        fetchFiles?.(normalizedParentPath);
        setLoadedPaths((prev) => new Set(prev).add(normalizedParentPath));

        return res;
      });
    },
    [fetchFiles, onCreateFolder],
  );

  return (
    <div className="flex">
      <div className="flex gap-x-2 items-end">
        <div className={CONTROL_WITH_BUTTON_WIDTH}>
          <DialInput
            id="filePath"
            disabled={disabled}
            value={value}
            onChange={onInputChange}
            placeholder={placeholder}
            labelProps={{ label }}
          />
        </div>
        <DialNeutralButton
          disabled={disabled}
          onClick={onOpenFilePathModal}
          label={t(ActionMenuOperationI18nKey.Move_to)}
          iconBefore={<IconFolderShare {...BASE_BUTTON_ICON_PROPS} />}
        />

        <DialDestinationFolderPopup
          open={isModalOpen}
          onClose={onCloseFilePathModal}
          mode="move"
          items={processAssetsData(files, view) as DialFile[]}
          onFolderPopupPathChange={onDestinationFolderChange}
          onConfirm={onCloseFilePathModal}
          header={modalTitle}
          sourceFolder={ROOT_FOLDER}
          onCreateFolder={handleCreateFolder}
          gridOptions={getFilePathGridOptions(t, view)}
        />
      </div>
    </div>
  );
};

export default FilePath;
