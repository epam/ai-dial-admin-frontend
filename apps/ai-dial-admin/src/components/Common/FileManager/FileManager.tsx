'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import {
  DialCopiedItem,
  DialDeletedItem,
  DialFile,
  DialFileManager,
  DialUploadFileItem,
  FileManagerColumnKey,
} from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';

import { importFiles } from '@/src/utils/files/import-files';
import { getParentPathByFullPath } from '@/src/components/Assets/utils';
import { getFormDataForImport, getImportTitle } from '@/src/components/EntityListView/HeaderButtons/utils';
import { getImportResults } from '@/src/components/EntityListView/Import/utils';
import { FILE_PREVIEW, PREVIEW_EXTENSIONS, ROOT_FOLDER } from '@/src/constants/file';
import { FileManagerI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ImportResult } from '@/src/models/import';
import { ServerActionResponse } from '@/src/models/server-action';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { getFolderName } from '@/src/utils/files/folder';
import { getSuccessNotification } from '@/src/utils/notification';
import {
  getBulkActionsToolbarOptions,
  getDestinationFolderPopupOptions,
  getGridOptions,
  getToolbarOptions,
  getTreeOptions,
  getValidationMessages,
  validateCreateFolder,
} from './utils';
import { NEW_FOLDER_NAME } from './constants';
import { FileManagerGridRow } from '@epam/ai-dial-ui-kit/dist/src/components/FileManager/FileManagerContext';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';

interface Props {
  view: ApplicationRoute;
  label: string;
  columnDefs: ColDef[];
  getContext: () => AssetsFolderContext;
  onCreateFolder: (file: DialUploadFileItem | undefined, folderPath: string) => Promise<ServerActionResponse>;
  onDeleteItems?: (fileNodes: DialDeletedItem[]) => Promise<ServerActionResponse[]>;
  onMoveItems: (
    items: DialCopiedItem[],
    sourceFolder: string,
    destinationFolder: string,
  ) => Promise<(ServerActionResponse[] | ServerActionResponse)[]>;
  onExport: (files: DialFile[]) => Promise<void>;
  customUploadFileAction?: (currentPath?: string, currentFolder?: DialFile) => void;
  customCreateNewItemAction?: (currentPath?: string, currentFolder?: DialFile) => void;
  customDuplicateAction?: (items?: DialFile[]) => void;
  customDeleteItemsAction?: (items: DialFile[], parentFolderPath: string) => void;
  onTableFileClick?: (item: FileManagerGridRow) => void;
  filterData?: (data: AssetWithVersion[]) => AssetWithVersion[];
  selectedVersionsMap?: Record<string, string[]>;
  nonClickableTableColumns?: FileManagerColumnKey[];
  onPathChange?: (nextPath?: string) => void;
  onSelectedPathsChange?: (paths: Set<string>) => void;
  selectedPaths?: Set<string>;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
}

const FileManager: FC<Props> = ({
  label,
  columnDefs,
  view,
  getContext,
  onCreateFolder,
  onDeleteItems,
  onMoveItems,
  onExport,
  filterData,
  onPathChange,
  ...props
}) => {
  const [loadedPaths, setLoadedPaths] = useState(new Set(['']));

  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { showNotification } = useNotification();
  const { files, fetchFiles, isFetchingFiles, filePath, setFilePath, expandedFolders, setExpandedFolders } =
    getContext();

  useEffect(() => {
    if (files == null || files?.length === 0) {
      fetchFiles(`${ROOT_FOLDER}/`);
      setLoadedPaths(new Set([`${ROOT_FOLDER}/`]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const managerLabel = useMemo(() => <h1 className="text-primary leading-[48px]">{label}</h1>, [label]);
  const filteredFiles = useMemo(() => {
    return filterData ? filterData(files as AssetWithVersion[]) : files;
  }, [files, filterData]);

  const scrollToNewFolder = useCallback(() => {
    let attempts = 0;
    const maxAttempts = 20;
    const scrollInterval = setInterval(() => {
      const selectedElement = document.querySelector('[aria-selected="true"]');
      if (selectedElement) {
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        clearInterval(scrollInterval);
      } else if (attempts >= maxAttempts) {
        clearInterval(scrollInterval);
      }
      attempts++;
    }, 100);
  }, []);

  // TODO: move common functions into context files

  const handleCreateFolder = useCallback(
    async (_: DialUploadFileItem | undefined, folderPath: string) => {
      const newPath = `${folderPath.replaceAll('//', '/')}/`;

      onCreateFolder(_, folderPath).then((res) => {
        if (res.success) {
          const parentPath = getParentPathByFullPath(newPath) || `${ROOT_FOLDER}/`;

          fetchFiles(parentPath);

          const newExpanded = new Set(expandedFolders.add(parentPath).add(newPath));
          setExpandedFolders(newExpanded);
          setFilePath(newPath);
          setLoadedPaths((prev) => new Set(prev).add(newPath));
          const results = (res.response as { importResults: ImportResult[] }).importResults;
          const translatedType = t(getImportTitle(view)).toLowerCase();
          showNotification(
            getSuccessNotification(
              t(FileManagerI18nKey.CreateFolderSuccessTitle),
              t(FileManagerI18nKey.CreateFolderSuccessDescription),
            ),
          );
          getImportResults(results, getFolderName(filePath) as string, translatedType, t);

          scrollToNewFolder();
        }
      });
    },
    [
      onCreateFolder,
      expandedFolders,
      fetchFiles,
      filePath,
      scrollToNewFolder,
      setExpandedFolders,
      setFilePath,
      showNotification,
      t,
      view,
    ],
  );

  const handleAddChild = useCallback(
    (files: DialFile[]) => {
      const newPath = files[0].path + NEW_FOLDER_NAME;
      handleCreateFolder(void 0, newPath);
    },
    [handleCreateFolder],
  );

  const handleAddSibling = useCallback(
    (files: DialFile[]) => {
      const newPath = files[0].path.replace(/([^/]+)\/?$/, NEW_FOLDER_NAME);
      handleCreateFolder(void 0, newPath);
    },
    [handleCreateFolder],
  );

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
      onPathChange?.(nextPath);
    },
    [expandedFolders, fetchFiles, loadedPaths, setExpandedFolders, setFilePath, onPathChange],
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

  const handleManagePermissions = useCallback((path?: string) => {
    if (!path) {
      return;
    }

    window.open(`${ApplicationRoute.FoldersStorage}?path=${encodeURIComponent(path)}`, '_blank');
  }, []);

  const handleCreateFolderValidate = useCallback(
    (name: string) => {
      return validateCreateFolder(name, t);
    },
    [t],
  );

  const handleDownloadFiles = useCallback(
    async (files: DialFile[]) => {
      onExport?.(files);
    },
    [onExport],
  );

  const handleDeleteFileNodes = useCallback(
    async (fileNodes: DialDeletedItem[]) => {
      onDeleteItems?.(fileNodes).then((result) => {
        const isSuccess = result.every((res) => res.success);
        if (isSuccess) {
          const parentPath = getParentPathByFullPath(fileNodes[0]?.sourceUrl) || `${ROOT_FOLDER}/`;
          fetchFiles(parentPath);
          setFilePath(parentPath);
        }
      });
    },
    [onDeleteItems, fetchFiles, setFilePath],
  );

  const handleMoveToFiles = useCallback(
    async (items: DialCopiedItem[], sourceFolder: string, destinationFolder: string) => {
      onMoveItems(items, sourceFolder, destinationFolder).then((result) => {
        const isSuccess = result.every((res) => (Array.isArray(res) ? res.every((r) => r.success) : res.success));
        if (isSuccess) {
          fetchFiles(destinationFolder);
          fetchFiles(sourceFolder);
        }
      });
    },
    [fetchFiles, onMoveItems],
  );

  const handlePreviewFile = useCallback((path?: string) => {
    window.open(`${FILE_PREVIEW}?path=${encodeURIComponent(path || '')}`, '_blank');
  }, []);

  const handleDragAndDropFiles = useCallback(
    (files: DialUploadFileItem[], destinationFolder: string) => {
      const promises: Promise<ServerActionResponse>[] = [];

      files.forEach((file) => {
        const { body } = getFormDataForImport(
          destinationFolder,
          [file.fileContent],
          ImportFileType.FILES,
          ConflictResolutionPolicy.SKIP,
          void 0,
          false,
          view,
        );
        promises.push(importFiles(body, ImportFileType.FILES));
      });

      Promise.all(promises).then((result) => {
        const isSuccess = result.every((res) => res.success);
        if (isSuccess) {
          fetchFiles?.(destinationFolder);
        }
      });
    },
    [fetchFiles, view],
  );

  return (
    <DialFileManager
      managerLabel={managerLabel}
      className="bg-layer-2 py-4 px-6"
      path={filePath}
      defaultPath={`${ROOT_FOLDER}/`}
      items={filteredFiles as []}
      filesLoading={isFetchingFiles}
      showNavigationPanel={false}
      bulkActionsToolbarOptions={getBulkActionsToolbarOptions(t)}
      toolbarOptions={getToolbarOptions(view, isReadOnlyAdmin, t)}
      treeOptions={getTreeOptions(
        isReadOnlyAdmin,
        isFetchingFiles,
        loadedPaths,
        expandedFolders,
        setExpandedFolders,
        t,
      )}
      gridOptions={getGridOptions(view, isReadOnlyAdmin, columnDefs, t)}
      onPathChange={handleOnPathChange}
      onAddChild={isReadOnlyAdmin ? undefined : handleAddChild}
      onAddSibling={isReadOnlyAdmin ? undefined : handleAddSibling}
      onCreateFolder={isReadOnlyAdmin ? undefined : handleCreateFolder}
      onDownloadFiles={handleDownloadFiles}
      onCreateFolderValidate={handleCreateFolderValidate}
      onRenameValidate={handleCreateFolderValidate}
      onDeleteFiles={isReadOnlyAdmin ? undefined : handleDeleteFileNodes}
      onMoveToFiles={isReadOnlyAdmin ? undefined : handleMoveToFiles}
      onFolderPopupPathChange={handleFolderPopupPathChange}
      onManagePermissions={isReadOnlyAdmin ? undefined : handleManagePermissions}
      onPreview={handlePreviewFile}
      onUploadFiles={isReadOnlyAdmin ? undefined : handleDragAndDropFiles}
      folderCreationValidationMessages={getValidationMessages(t)}
      renameValidationMessages={getValidationMessages(t)}
      destinationFolderPopupOptions={getDestinationFolderPopupOptions(t)}
      isRenameFileAvailable={false}
      isDuplicateFolderAvailable={false}
      previewExtensions={PREVIEW_EXTENSIONS}
      {...props}
    />
  );
};

export default FileManager;
