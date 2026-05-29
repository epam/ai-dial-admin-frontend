import { FC, useCallback, useEffect, useState } from 'react';

import { DialFileManager, DialFileNodeType, FileManagerGridRow } from '@epam/ai-dial-ui-kit';

import { FILES_GRID_COLUMNS } from '@/src/components/Assets/Files/constants';
import { getGridOptions, getTreeOptions } from '@/src/components/Common/FileManager/utils';
import { ROOT_FOLDER } from '@/src/constants/file';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { getFolderNameAndPath } from '@/src/utils/files/path';

interface Props {
  value: string;
  isModalOpen: boolean;
  onChangeSelectedFilePath: (filePath: string | null) => void;
}

const PublicFileManager: FC<Props> = ({ value, isModalOpen, onChangeSelectedFilePath }) => {
  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const {
    files,
    fetchFiles,
    fetchFolderHierarchy,
    isFetchingFiles,
    filePath,
    setFilePath,
    expandedFolders,
    setExpandedFolders,
  } = useFileFolder();

  const [loadedPaths, setLoadedPaths] = useState(new Set(['']));

  useEffect(() => {
    if ((files == null || files?.length === 0) && isModalOpen) {
      if (value) {
        const path = getFolderNameAndPath(value).path;
        fetchFolderHierarchy?.(`${path}/`, true);
      } else {
        fetchFiles(`${ROOT_FOLDER}/`);
        setLoadedPaths(new Set([`${ROOT_FOLDER}/`]));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, isModalOpen]);

  useEffect(() => {
    if (value && files !== null && files.length > 0 && isModalOpen) {
      const path = getFolderNameAndPath(value).path;
      fetchFolderHierarchy?.(`${path}/`, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, isModalOpen]);

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

  const handleSelectionClick = useCallback(
    (files: FileManagerGridRow[]) => {
      if (files.length > 0 && files[0].nodeType === DialFileNodeType.ITEM) {
        onChangeSelectedFilePath(files[0].id);
      } else {
        onChangeSelectedFilePath(null);
      }
    },
    [onChangeSelectedFilePath],
  );

  return (
    <DialFileManager
      className="p-0 gap-0 bg-layer-3"
      gridClassName="p-3"
      path={filePath}
      items={files as []}
      filesLoading={isFetchingFiles}
      showNavigationPanel={false}
      treeOptions={getTreeOptions(
        isReadOnlyAdmin,
        isFetchingFiles,
        value ? expandedFolders : loadedPaths,
        expandedFolders,
        ApplicationRoute.Files,
        setExpandedFolders,
        t,
      )}
      defaultSelectedPaths={value ? new Set([value]) : void 0}
      gridOptions={getGridOptions(ApplicationRoute.Files, isReadOnlyAdmin, FILES_GRID_COLUMNS, t, true)}
      onPathChange={handleOnPathChange}
      onFolderPopupPathChange={handleFolderPopupPathChange}
      handleSelectionClick={handleSelectionClick}
    />
  );
};

export default PublicFileManager;
