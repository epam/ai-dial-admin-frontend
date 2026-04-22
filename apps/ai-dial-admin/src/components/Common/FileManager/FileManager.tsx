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

import {
  getDeleteNotificationContent,
  getMoveNotificationContent,
  getParentPathByFullPath,
} from '@/src/components/Assets/utils';
import { getImportTitle } from '@/src/components/EntityListView/HeaderButtons/utils';
import { getImportResults } from '@/src/components/EntityListView/Import/utils';
import { FILE_PREVIEW, PREVIEW_EXTENSIONS, ROOT_FOLDER } from '@/src/constants/file';
import { FileManagerI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ImportResult } from '@/src/models/import';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getFolderName } from '@/src/utils/files/folder';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import {
  getBulkActionsToolbarOptions,
  getDestinationFolderPopupOptions,
  getGridOptions,
  getToolbarOptions,
  getTreeOptions,
  getNewFolderPath,
  getValidationMessages,
  validateCreateFolder,
} from './utils';
import { FileManagerGridRow } from '@epam/ai-dial-ui-kit/dist/src/components/FileManager/FileManagerContext';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { DialRootFolder } from '@epam/ai-dial-ui-kit/dist/src/models/file';
import MoveItemsModal from './MoveItemsModal';
import { MOVE_ITEMS_INDICATOR_DELAY } from './constants';

interface Props {
  view: ApplicationRoute;
  label: string;
  columnDefs: ColDef[];
  getContext: () => AssetsFolderContext;
  onCreateFolder: (
    file: DialUploadFileItem | undefined,
    folderPath: string,
  ) => Promise<ServerActionResponse | undefined>;
  onDeleteItems?: (fileNodes: DialDeletedItem[]) => Promise<(ServerActionResponse[] | ServerActionResponse)[]>;
  onMoveItems: (
    items: DialCopiedItem[],
    sourceFolder: string,
    destinationFolder: string,
  ) => Promise<(ServerActionResponse[] | ServerActionResponse)[]>;
  customUploadFileAction?: (currentPath?: string, currentFolder?: DialFile, preselectedItems?: File[]) => void;
  onExport?: (files: DialFile[]) => Promise<void>;
  onOpenInNewTab?: (file: DialFile) => void;
  customCreateNewItemAction?: (currentPath?: string, currentFolder?: DialFile) => void;
  customDuplicateAction?: (items?: DialFile[]) => void;
  customDeleteItemsAction?: (items: DialFile[], parentFolderPath: string) => void;
  customDownloadItemsAction?: (items?: DialFile[]) => void;
  onTableFileClick?: (item: FileManagerGridRow) => void;
  filterData?: (data: AssetWithVersion[]) => AssetWithVersion[];
  selectedVersionsMap?: Record<string, string[]>;
  nonClickableTableColumns?: FileManagerColumnKey[];
  onPathChange?: (nextPath?: string) => void;
  onSelectedPathsChange?: (paths: Set<string>) => void;
  selectedPaths?: Set<string>;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  showHiddenFileSwitcherInDestinationPopup?: boolean;
  movingItems: number;
  movedItems: number;
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
  customUploadFileAction,
  movingItems,
  movedItems,
  ...props
}) => {
  const [loadedPaths, setLoadedPaths] = useState(new Set(['']));

  const t = useI18n();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const { showNotification } = useNotification();
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
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
        if (res && res.success) {
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
      const newPath = getNewFolderPath(files[0], filteredFiles, 'child');
      handleCreateFolder(void 0, newPath);
    },
    [handleCreateFolder, filteredFiles],
  );

  const handleAddSibling = useCallback(
    (files: DialFile[]) => {
      const newPath = getNewFolderPath(files[0], filteredFiles, 'sibling');
      handleCreateFolder(void 0, newPath);
    },
    [handleCreateFolder, filteredFiles],
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
        const isSuccess = result.every((res) => (Array.isArray(res) ? res.every((r) => r.success) : res.success));
        if (isSuccess) {
          const parentPath = getParentPathByFullPath(fileNodes[0]?.sourceUrl) || `${ROOT_FOLDER}/`;
          fetchFiles(parentPath);
          setFilePath(parentPath);

          const { title, description } = getDeleteNotificationContent(view, fileNodes, t);
          showNotification(getSuccessNotification(title, description));
        }
      });
    },
    [onDeleteItems, fetchFiles, setFilePath, showNotification, t, view],
  );

  const handleMoveToFiles = useCallback(
    async (items: DialCopiedItem[], sourceFolder: string, destinationFolder: string) => {
      if (!items?.length) {
        return;
      }

      if (sourceFolder !== destinationFolder) {
        setIsMoveModalOpen(true);
      }

      onMoveItems(items, sourceFolder, destinationFolder).then((result) => {
        setTimeout(() => {
          setIsMoveModalOpen(false);
        }, MOVE_ITEMS_INDICATOR_DELAY);

        const isSuccess = result.every((res) => (Array.isArray(res) ? res.every((r) => r.success) : res.success));
        if (isSuccess) {
          fetchFiles(destinationFolder);
          fetchFiles(sourceFolder);

          const { title, description } = getMoveNotificationContent(view, items, sourceFolder, destinationFolder, t);
          showNotification(getSuccessNotification(title, description));
        } else {
          const errorRes = result.flat().find((res) => !res.success);
          if (errorRes) {
            showNotification(getErrorNotification(errorRes.errorHeader, errorRes.errorMessage, errorRes.requestId));
          }
        }
      });
    },
    [fetchFiles, onMoveItems, showNotification, t, view],
  );

  const handlePreviewFile = useCallback((path?: string) => {
    window.open(`${FILE_PREVIEW}?path=${encodeURIComponent(path || '')}`, '_blank');
  }, []);

  const handleDragAndDropFiles = useCallback(
    (files: DialUploadFileItem[], destinationFolder: string) => {
      const folder = { path: destinationFolder };
      customUploadFileAction?.(
        destinationFolder,
        folder as DialFile,
        files.map((file) => file.fileContent),
      );
    },
    [customUploadFileAction],
  );

  const handleMoveModalClose = useCallback(() => {
    setIsMoveModalOpen(false);
  }, []);

  return (
    <>
      <DialFileManager
        managerLabel={managerLabel}
        className="bg-layer-2 py-4 px-6"
        path={filePath}
        defaultPath={`${ROOT_FOLDER}/`}
        items={filteredFiles as []}
        rootItem={filteredFiles?.[0] as DialRootFolder}
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
        destinationFolderPopupOptions={getDestinationFolderPopupOptions(view, t)}
        isRenameFileAvailable={false}
        isDuplicateFolderAvailable={false}
        previewExtensions={PREVIEW_EXTENSIONS}
        customUploadFileAction={customUploadFileAction}
        {...props}
      />
      <MoveItemsModal
        isModalOpen={isMoveModalOpen}
        onCancel={handleMoveModalClose}
        totalItems={movingItems}
        movedItems={movedItems}
      />
    </>
  );
};

export default FileManager;
