'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialCopiedItem, DialDeletedItem, DialFile, DialFileManager, DialUploadFileItem } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';

import { bulkDeleteFiles, exportFiles, importFiles, moveFiles } from '@/src/app/[lang]/files/actions';
import { changeFolder, createFolderWithFiles, removeFolder } from '@/src/app/[lang]/folders-storage/actions';
import { getParentPathByFullPath } from '@/src/components/Assets/utils';
import { getFormDataForImport, getImportTitle } from '@/src/components/EntityListView/HeaderButtons/utils';
import { getImportResults } from '@/src/components/EntityListView/Import/utils';
import { FILE_PREVIEW, PREVIEW_EXTENSIONS, ROOT_FOLDER } from '@/src/constants/file';
import { FileManagerI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialFileNodeType } from '@/src/models/dial/file';
import { ImportResult } from '@/src/models/import';
import { ServerActionResponse } from '@/src/models/server-action';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';
import { ResourceType } from '@/src/types/resource-type';
import { ApplicationRoute } from '@/src/types/routes';
import { getFolderName } from '@/src/utils/files/folder';
import { getSuccessNotification } from '@/src/utils/notification';
import {
  createEmptyFile,
  getBulkActionsToolbarOptions,
  getDestinationFolderPopupOptions,
  getGridOptions,
  getToolbarOptions,
  getTreeOptions,
  getValidationMessages,
  validateCreateFolder,
} from './utils';
import { downloadFile } from '@/src/utils/download';
import { NEW_FOLDER_NAME } from './constants';

interface Props {
  view: ApplicationRoute;
  label: string;
  columnDefs: ColDef[];
  getContext: () => AssetsFolderContext;
  customUploadFileAction?: (currentPath?: string, currentFolder?: DialFile) => void;
}

const FileManager: FC<Props> = ({ label, columnDefs, view, getContext, ...props }) => {
  const [loadedPaths, setLoadedPaths] = useState(new Set(['']));

  const t = useI18n();
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
      // file arg is not used, because folder with empty file is not created
      const { emptyFile } = createEmptyFile();
      const newPath = `${folderPath.replaceAll('//', '/')}/`;

      const body = getFormDataForImport(
        newPath,
        [emptyFile],
        ImportFileType.FILES,
        ConflictResolutionPolicy.SKIP,
        void 0,
        false,
        view,
      ).body;

      createFolderWithFiles(body, ImportFileType.FILES, view).then((res) => {
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

  const handleDownloadFiles = useCallback(async (files: DialFile[]) => {
    const filePaths = files.map((file) => file.path);

    exportFiles(filePaths).then((res) => {
      const { blob, fileName } = res as { blob: Blob; fileName: string };
      downloadFile(blob, fileName);
    });
  }, []);

  const handleDeleteFileNodes = useCallback(
    async (fileNodes: DialDeletedItem[]) => {
      const files = fileNodes.filter((file) => file.nodeType === DialFileNodeType.ITEM);
      const folders = fileNodes.filter((file) => file.nodeType === DialFileNodeType.FOLDER);

      const promises = [];
      if (files.length > 0) {
        const filePaths = files.map((file) => ({ path: file.sourceUrl }));
        promises.push(bulkDeleteFiles(filePaths));
      }
      folders.forEach((folder) => {
        promises.push(removeFolder(folder.sourceUrl));
      });

      Promise.all(promises).then((result) => {
        const isSuccess = result.every((res) => res.success);
        if (isSuccess) {
          const parentPath = getParentPathByFullPath(fileNodes[0]?.sourceUrl) || `${ROOT_FOLDER}/`;
          fetchFiles(parentPath);
          setFilePath(parentPath);
        }
      });
    },
    [fetchFiles, setFilePath],
  );

  const handleMoveToFiles = useCallback(
    async (items: DialCopiedItem[], sourceFolder: string, destinationFolder: string) => {
      const files = items.filter((file) => file.nodeType === DialFileNodeType.ITEM);
      const folders = items.filter((file) => file.nodeType === DialFileNodeType.FOLDER);

      const promises: (Promise<ServerActionResponse> | Promise<ServerActionResponse[]>)[] = [];
      files.forEach((file) => {
        if (sourceFolder !== destinationFolder) {
          // Move file
          const newPath = file.destinationUrl.replaceAll('//', '/').split('/').slice(0, -1).join('/');
          promises.push(moveFiles([file.sourceUrl.replaceAll('//', '/')], newPath));
        } else {
          // Rename file
        }
      });
      folders.forEach((folder) => {
        promises.push(
          changeFolder(
            folder.sourceUrl.replaceAll('//', '/'),
            folder.destinationUrl.replaceAll('//', '/'),
            ResourceType.FILE,
          ),
        );
      });

      Promise.all(promises).then((result) => {
        const isSuccess = result.every((res) => (Array.isArray(res) ? res.every((r) => r.success) : res.success));
        if (isSuccess) {
          fetchFiles(destinationFolder);
          fetchFiles(sourceFolder);
        }
      });
    },
    [fetchFiles],
  );

  const handlePreviewFile = useCallback((path?: string) => {
    window.open(`/${FILE_PREVIEW}?path=${encodeURIComponent(path || '')}`, '_blank');
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
      items={files as []}
      filesLoading={isFetchingFiles}
      showNavigationPanel={false}
      bulkActionsToolbarOptions={getBulkActionsToolbarOptions(t)}
      toolbarOptions={getToolbarOptions(t)}
      treeOptions={getTreeOptions(isFetchingFiles, loadedPaths, expandedFolders, setExpandedFolders, t)}
      gridOptions={getGridOptions(columnDefs, t)}
      onPathChange={handleOnPathChange}
      onAddChild={handleAddChild}
      onAddSibling={handleAddSibling}
      onCreateFolder={handleCreateFolder}
      onDownloadFiles={handleDownloadFiles}
      onCreateFolderValidate={handleCreateFolderValidate}
      onDeleteFiles={handleDeleteFileNodes}
      onMoveToFiles={handleMoveToFiles}
      onFolderPopupPathChange={handleFolderPopupPathChange}
      onManagePermissions={handleManagePermissions}
      onPreview={handlePreviewFile}
      onUploadFiles={handleDragAndDropFiles}
      folderCreationValidationMessages={getValidationMessages(t)}
      renameValidationMessages={getValidationMessages(t)}
      destinationFolderPopupOptions={getDestinationFolderPopupOptions(t)}
      isRenameFileAvailable={false}
      previewExtensions={PREVIEW_EXTENSIONS}
      {...props}
    />
  );
};

export default FileManager;
