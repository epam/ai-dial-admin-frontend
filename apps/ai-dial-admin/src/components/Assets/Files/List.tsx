'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  DialCopiedItem,
  DialDeletedItem,
  DialFile,
  DialFileManager,
  DialUploadFileItem,
  GridSelectionMode,
  NAME_COLUMN,
  SIZE_COLUMN,
  UPDATED_AT_COLUMN,
} from '@epam/ai-dial-ui-kit';

import { bulkDeleteFiles, exportFiles, importFiles, moveFiles } from '@/src/app/[lang]/files/actions';
import { changeFolder, createFolderWithFiles, removeFolder } from '@/src/app/[lang]/folders-storage/actions';
import { getFormDataForImport, getImportTitle } from '@/src/components/EntityListView/HeaderButtons/utils';
import { getImportResults } from '@/src/components/EntityListView/Import/utils';
import { ROOT_FOLDER } from '@/src/constants/file';
import { ButtonsI18nKey, FileManagerI18nKey, FoldersI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { DialFileNodeType } from '@/src/models/dial/file';
import { ImportResult } from '@/src/models/import';
import { ServerActionResponse } from '@/src/models/server-action';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';
import { ResourceType } from '@/src/types/resource-type';
import { ApplicationRoute } from '@/src/types/routes';
import { downloadFile } from '@/src/utils/download';
import { getFolderName } from '@/src/utils/files/folder';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getParentPathByFullPath } from '../utils';
import Modals, { ModalType } from '../../EntityListView/Components/Modals';
import { ImportData } from '@/src/models/import-asset';

const FILES_GRID_COLUMNS = [NAME_COLUMN('Display name'), UPDATED_AT_COLUMN('Updated time'), SIZE_COLUMN('Size')];

const FilesList = () => {
  const [path, setPath] = useState('');
  const [loadedPaths, setLoadedPaths] = useState(new Set(['']));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importFolder, setImportFolder] = useState<DialFile | null>(null);

  const t = useI18n();
  const { showNotification } = useNotification();
  const { files, fetchFiles, isFetchingFiles } = useFileFolder();

  useEffect(() => {
    if (files == null || files?.length === 0) {
      fetchFiles(`${ROOT_FOLDER}/`);
      setLoadedPaths(new Set([`${ROOT_FOLDER}/`]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

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
    async (file: DialUploadFileItem, folderPath: string) => {
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
        ApplicationRoute.Files,
      ).body;

      createFolderWithFiles(body, ImportFileType.FILES, ApplicationRoute.Files).then((res) => {
        if (res.success) {
          const patentPath = getParentPathByFullPath(newPath) || `${ROOT_FOLDER}/`;
          fetchFiles?.(patentPath, true);
          const results = (res.response as { importResults: ImportResult[] }).importResults;
          const translatedType = t(getImportTitle(ApplicationRoute.Files)).toLowerCase();
          showNotification(getSuccessNotification(t(FoldersI18nKey.FolderCreateSuccess)));
          getImportResults(results, getFolderName(path) as string, translatedType, t, showNotification);
        }
      });
    },
    [fetchFiles, path, showNotification, t],
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
          ApplicationRoute.Files,
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
    [fetchFiles, showNotification, t],
  );

  const handleImportArchive = useCallback(
    async (file: File, name: string, destinationFolder: string) => {
      const destinationFolderPath = destinationFolder ? destinationFolder : `${ROOT_FOLDER}/`;
      const body = getFormDataForImport(
        destinationFolderPath,
        [file],
        ImportFileType.ARCHIVE,
        ConflictResolutionPolicy.SKIP,
        [],
        false,
        ApplicationRoute.Files,
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
    [fetchFiles, showNotification, t],
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

  const handleModalOpen = useCallback((currentPath?: string, currentFolder?: DialFile) => {
    setIsModalOpen(true);
    setImportFolder(currentFolder || null);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setImportFolder(null);
  }, []);

  const onImport = useCallback(
    (
      fileType: ImportFileType,
      file: ImportData,
      conflictResolutionStrategy: string,
      path: string,
      ignorePaths?: boolean,
    ) => {
      let destinationFolder = importFolder?.path ? importFolder.path : `${ROOT_FOLDER}/`;
      const { body } = getFormDataForImport(
        destinationFolder,
        file,
        fileType,
        conflictResolutionStrategy,
        void 0,
        ignorePaths,
        ApplicationRoute.Files,
      );
      importFiles(body, fileType).then((res) => {
        if (res.success) {
          fetchFiles?.(destinationFolder, true);
          showNotification(getSuccessNotification(t(FoldersI18nKey.Import)));
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });

      handleModalClose();
    },
    [handleModalClose, showNotification, t, fetchFiles, importFolder],
  );

  return (
    <>
      <DialFileManager
        title={t(MenuI18nKey.Files)}
        className="bg-layer-2 py-4 px-6"
        path={path}
        defaultPath={`${ROOT_FOLDER}/`}
        items={files as []}
        filesLoading={isFetchingFiles}
        showNavigationPanel={false}
        bulkActionsToolbarOptions={{
          getSelectionLabel: (selectedCount: number) => `${selectedCount} ${t(FileManagerI18nKey.SelectedItems)}`,
          actionLabels: {
            move: t(FileManagerI18nKey.Move),
            download: t(ButtonsI18nKey.Export),
            delete: t(ButtonsI18nKey.Delete),
          },
        }}
        toolbarOptions={{
          showHiddenFilesToggle: false,
          newActions: {
            newFolder: { label: 'Folder', icon: null },
            uploadFiles: { label: 'File', icon: null },
          },
          newButtonLabel: t(ButtonsI18nKey.Create),
        }}
        treeOptions={{
          collapsed: false,
          expandedPaths: new Set<string>([`${ROOT_FOLDER}/`]),
          loadedPaths,
          loadingPaths: isFetchingFiles ? new Set<string>([ROOT_FOLDER]) : new Set<string>(),
          actionLabels: {
            addSibling: t(FileManagerI18nKey.AddSibling),
            addChild: t(FileManagerI18nKey.AddChild),
            move: t(FileManagerI18nKey.Move),
            download: t(ButtonsI18nKey.Download),
            delete: t(ButtonsI18nKey.Delete),
            rename: t(FileManagerI18nKey.Rename),
            managePermissions: t(FileManagerI18nKey.ManagePermissions),
          },
        }}
        gridOptions={{
          columnDefs: FILES_GRID_COLUMNS,
          selectionMode: GridSelectionMode.MULTIPLE,
          actionLabels: {
            addSibling: t(FileManagerI18nKey.AddSibling),
            addChild: t(FileManagerI18nKey.AddChild),
            move: t(FileManagerI18nKey.Move),
            download: t(ButtonsI18nKey.Download),
            managePermissions: t(FileManagerI18nKey.ManagePermissions),
            rename: t(FileManagerI18nKey.Rename),
            delete: t(ButtonsI18nKey.Delete),
          },
        }}
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
        folderCreationValidationMessages={{
          emptyName: t(FileManagerI18nKey.EnterFolderName),
          duplicateName: t(FileManagerI18nKey.NameExists),
        }}
        renameValidationMessages={{
          emptyName: t(FileManagerI18nKey.EnterFolderName),
          duplicateName: t(FileManagerI18nKey.NameExists),
        }}
        isRenameFileAvailable={false}
        customUploadFileAction={handleModalOpen}
      />
      <Modals
        route={ApplicationRoute.Files}
        isModalOpen={isModalOpen}
        modalType={ModalType.import}
        onImport={onImport}
        onClose={handleModalClose}
      />
    </>
  );
};

export default FilesList;
