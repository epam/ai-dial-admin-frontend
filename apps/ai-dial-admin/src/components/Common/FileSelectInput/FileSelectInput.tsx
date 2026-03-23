import { FC, useCallback, useEffect, useState } from 'react';

import {
  DialFileManager,
  DialFileNodeType,
  DialFormPopup,
  DialInputPopup,
  DialLabel,
  PopupSize,
} from '@epam/ai-dial-ui-kit';
import { FileManagerGridRow } from '@epam/ai-dial-ui-kit/dist/src/components/FileManager/FileManagerContext';

import { FILES_GRID_SIMPLE_COLUMNS } from '@/src/components/Assets/Files/constants';
import { getGridOptions, getTreeOptions } from '@/src/components/Common/FileManager/utils';
import { ROOT_FOLDER } from '@/src/constants/file';
import { BasicI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';

interface Props {
  value: string;
  label?: string;
  elementId?: string;
  disabled?: boolean;
  inputClassName?: string;
  onChangeValue: (value: string) => void;
}

const FileSelectInput: FC<Props> = ({ value, label, elementId, disabled, inputClassName, onChangeValue }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { files, fetchFiles, isFetchingFiles, filePath, setFilePath, expandedFolders, setExpandedFolders } =
    useFileFolder();

  const [loadedPaths, setLoadedPaths] = useState(new Set(['']));
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (files == null || files?.length === 0) {
      fetchFiles(`${ROOT_FOLDER}/`);
      setLoadedPaths(new Set([`${ROOT_FOLDER}/`]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const handleOnPathChange = useCallback(
    (nextPath: string | undefined) => {
      if (!nextPath) {
        return;
      }
      const newExpanded = new Set(expandedFolders);

      if (newExpanded.has(nextPath)) {
        newExpanded.delete(nextPath);
      } else {
        newExpanded.add(nextPath);
      }
      if (!loadedPaths.has(nextPath)) {
        fetchFiles(nextPath);
      }
      setFilePath(nextPath);
      setLoadedPaths((prev) => new Set(prev).add(nextPath));
      setExpandedFolders(newExpanded);
    },
    [expandedFolders, fetchFiles, loadedPaths, setExpandedFolders, setFilePath],
  );

  const handleFolderPopupPathChange = useCallback(
    (nextPath: string | undefined) => {
      if (nextPath && !loadedPaths.has(nextPath)) {
        setLoadedPaths((prev) => new Set(prev).add(nextPath));
        fetchFiles(nextPath);
      }
    },
    [loadedPaths, fetchFiles],
  );

  const handleSelectionClick = useCallback((files: FileManagerGridRow[]) => {
    if (files.length > 0 && files[0].nodeType === DialFileNodeType.ITEM) {
      setSelectedFilePath(files[0].id);
    } else {
      setSelectedFilePath(null);
    }
  }, []);

  const onConfirm = useCallback(() => {
    onChangeValue(selectedFilePath ?? '');
    setIsModalOpen(false);
  }, [onChangeValue, selectedFilePath]);

  return (
    <div className="flex flex-col gap-y-2">
      {label && <DialLabel label={label} htmlFor={elementId} />}
      <DialInputPopup
        disabled={disabled || isReadOnlyAdmin}
        open={isModalOpen}
        selectedValue={value}
        onOpen={() => setIsModalOpen(true)}
        emptyValueText={t(BasicI18nKey.None)}
        inputClassName={inputClassName}
      >
        <DialFormPopup
          header={'Select document'}
          portalId="fileSelect"
          open={isModalOpen}
          cancelLabel={t(ButtonsI18nKey.Cancel)}
          submitLabel={t(ButtonsI18nKey.Confirm)}
          onSubmit={onConfirm}
          disableSubmitButton={!selectedFilePath}
          onClose={() => setIsModalOpen(false)}
          onCancel={() => setIsModalOpen(false)}
          className="h-[800px]"
          size={PopupSize.Lg}
        >
          <DialFileManager
            className="bg-layer-2 p-0 gap-0"
            path={filePath}
            items={files as []}
            filesLoading={isFetchingFiles}
            showNavigationPanel={false}
            treeOptions={getTreeOptions(
              isFetchingFiles,
              loadedPaths,
              expandedFolders,
              setExpandedFolders,
              t,
              isReadOnlyAdmin,
            )}
            gridOptions={getGridOptions(FILES_GRID_SIMPLE_COLUMNS, t, isReadOnlyAdmin, true)}
            onPathChange={handleOnPathChange}
            onFolderPopupPathChange={handleFolderPopupPathChange}
            handleSelectionClick={handleSelectionClick}
          />
        </DialFormPopup>
      </DialInputPopup>
    </div>
  );
};

export default FileSelectInput;
