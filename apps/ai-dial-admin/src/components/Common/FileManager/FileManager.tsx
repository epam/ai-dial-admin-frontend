'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';

import { DialCopiedItem, DialDeletedItem, DialFile, DialFileManager, DialUploadFileItem } from '@epam/ai-dial-ui-kit';
import { ColDef } from 'ag-grid-community';

import { bulkDeleteFiles, exportFiles, importFiles, moveFiles } from '@/src/app/[lang]/files/actions';
import { changeFolder, createFolderWithFiles, removeFolder } from '@/src/app/[lang]/folders-storage/actions';
import { getParentPathByFullPath } from '@/src/components/Assets/utils';
import { getFormDataForImport, getImportTitle } from '@/src/components/EntityListView/HeaderButtons/utils';
import { getImportResults } from '@/src/components/EntityListView/Import/utils';
import { ROOT_FOLDER } from '@/src/constants/file';
import { FileManagerI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
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
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import {
  getBulkActionsToolbarOptions,
  getGridOptions,
  getToolbarOptions,
  getTreeOptions,
  getValidationMessages,
} from './utils';
import { downloadFile } from '@/src/utils/download';

interface Props {
  view: ApplicationRoute;
  label: string;
  columnDefs: ColDef[];
  getContext: () => AssetsFolderContext;
  customUploadFileAction?: (currentPath?: string, currentFolder?: DialFile) => void;
}

const FileManager: FC<Props> = ({ label, columnDefs, view, getContext, ...props }) => {
  const [path, setPath] = useState('');
  const [loadedPaths, setLoadedPaths] = useState(new Set(['']));

  const t = useI18n();
  const { showNotification } = useNotification();
  const { files, fetchFiles, isFetchingFiles } = getContext();

  useEffect(() => {
    if (files == null || files?.length === 0) {
      fetchFiles(`${ROOT_FOLDER}/`);
      setLoadedPaths(new Set([`${ROOT_FOLDER}/`]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const managerLabel = useMemo(() => <h1 className="text-primary leading-[48px]">{label}</h1>, [label]);

  // TODO: move common functions into context files
  const getEmptyFile = useCallback(() => {
    const filename = '.dial_folder';
    const fileType = 'text/plain';

    const emptyFile = new File(['1'], filename, {
      type: fileType,
    });

    const uploadFileItem: DialUploadFileItem = {
      fileContent: emptyFile,
      name: filename,
    };

    return uploadFileItem;
  }, []);

  const handleCreateFolder = useCallback(
    async (_: DialUploadFileItem, folderPath: string) => {
      // file arg is not used, because folder with empty file is not created
      const filename = '.dial_folder';
      const fileType = 'text/plain';
      const emptyFile = new File(['1'], filename, {
        type: fileType,
      });
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
          const patentPath = getParentPathByFullPath(newPath) || `${ROOT_FOLDER}/`;
          fetchFiles?.(patentPath, true);
          const results = (res.response as { importResults: ImportResult[] }).importResults;
          const translatedType = t(getImportTitle(view)).toLowerCase();
          showNotification(
            getSuccessNotification(
              t(FileManagerI18nKey.CreateFolderSuccessTitle),
              t(FileManagerI18nKey.CreateFolderSuccessDescription),
            ),
          );
          getImportResults(results, getFolderName(path) as string, translatedType, t);
        }
      });
    },
    [fetchFiles, path, showNotification, t, view],
  );

  const handleAddChild = useCallback(
    (files: DialFile[]) => {
      const newPath = files[0].path + 'New Folder';
      handleCreateFolder(getEmptyFile(), newPath);
    },
    [handleCreateFolder, getEmptyFile],
  );

  const handleAddSibling = useCallback(
    (files: DialFile[]) => {
      const newPath = files[0].path.replace(/([^/]+)\/?$/, 'New Folder');
      handleCreateFolder(getEmptyFile(), newPath);
    },
    [handleCreateFolder, getEmptyFile],
  );

  const handleImportFiles = useCallback(
    async (files: DialUploadFileItem[], destinationFolder: string) => {
      const promises: Promise<ServerActionResponse>[] = [];
      const destinationFolderPath = destinationFolder ? destinationFolder : `${ROOT_FOLDER}/`;
      files.forEach((file) => {
        const body = getFormDataForImport(
          destinationFolderPath,
          [file.fileContent],
          ImportFileType.FILES,
          ConflictResolutionPolicy.SKIP,
          [],
          false,
          view,
        ).body;

        promises.push(importFiles(body, ImportFileType.FILES));
      });

      Promise.all(promises).then((result) => {
        const isSuccess = result.every((res) => res.success);
        if (isSuccess) {
          fetchFiles?.(destinationFolderPath, true);
          showNotification(getSuccessNotification(t(FoldersI18nKey.Import)));
        } else {
          showNotification(getErrorNotification(result[0]?.errorHeader, result[0]?.errorMessage, result[0]?.requestId));
        }
      });
    },
    [fetchFiles, showNotification, t, view],
  );

  const handleImportArchive = useCallback(
    async (file: File, _: string, destinationFolder: string) => {
      const destinationFolderPath = destinationFolder ? destinationFolder : `${ROOT_FOLDER}/`;
      const body = getFormDataForImport(
        destinationFolderPath,
        [file],
        ImportFileType.ARCHIVE,
        ConflictResolutionPolicy.SKIP,
        [],
        false,
        view,
      ).body;

      importFiles(body, ImportFileType.ARCHIVE).then((res) => {
        if (res.success) {
          fetchFiles?.(destinationFolderPath, true);
          showNotification(getSuccessNotification(t(FoldersI18nKey.Import)));
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    },
    [fetchFiles, showNotification, t, view],
  );

  const handleOnPathChange = useCallback(
    (nextPath: string | undefined) => {
      if (!nextPath) {
        return;
      }

      if (!loadedPaths.has(nextPath)) {
        fetchFiles?.(nextPath, true);
      }
      setPath(nextPath);
      setLoadedPaths((prev) => new Set(prev).add(nextPath));
    },
    [fetchFiles, loadedPaths],
  );

  const handleFolderPopupPathChange = useCallback(
    (nextPath: string | undefined) => {
      if (nextPath && !loadedPaths.has(nextPath)) {
        setLoadedPaths((prev) => new Set(prev).add(nextPath));
        fetchFiles?.(nextPath, true);
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

  const handleCreateFolderValidate = useCallback((name: string) => {
    const forbiddenChars = /[<>:"/\\|?*]/;
    if (forbiddenChars.test(name)) {
      return 'Folder name contains forbidden characters: < > : " / \\ | ? *';
    }

    return null;
  }, []);

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
          fetchFiles?.(parentPath, true);
        }
      });
    },
    [fetchFiles],
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
          fetchFiles?.(destinationFolder, true);
          fetchFiles?.(sourceFolder, true);
        }
      });
    },
    [fetchFiles],
  );

  return (
    <DialFileManager
      managerLabel={managerLabel}
      className="bg-layer-2 py-4 px-6"
      path={path}
      defaultPath={`${ROOT_FOLDER}/`}
      items={files as []}
      filesLoading={isFetchingFiles}
      showNavigationPanel={false}
      bulkActionsToolbarOptions={getBulkActionsToolbarOptions(t)}
      toolbarOptions={getToolbarOptions(t)}
      treeOptions={getTreeOptions(isFetchingFiles, loadedPaths, t)}
      gridOptions={getGridOptions(columnDefs, t)}
      onPathChange={handleOnPathChange}
      onAddChild={handleAddChild}
      onAddSibling={handleAddSibling}
      onCreateFolder={handleCreateFolder}
      onUploadFiles={handleImportFiles}
      onUploadArchive={handleImportArchive}
      onDownloadFiles={handleDownloadFiles}
      onCreateFolderValidate={handleCreateFolderValidate}
      onDeleteFiles={handleDeleteFileNodes}
      onMoveToFiles={handleMoveToFiles}
      onFolderPopupPathChange={handleFolderPopupPathChange}
      onManagePermissions={handleManagePermissions}
      folderCreationValidationMessages={getValidationMessages(t)}
      renameValidationMessages={getValidationMessages(t)}
      isRenameFileAvailable={false}
      {...props}
    />
  );
};

export default FileManager;
