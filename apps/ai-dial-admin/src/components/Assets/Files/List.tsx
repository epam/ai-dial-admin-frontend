'use client';

import { useCallback, useState } from 'react';

import { DialCopiedItem, DialFile, DialFileNodeType, DialUploadFileItem } from '@epam/ai-dial-ui-kit';

import { importFiles } from '@/src/utils/files/import-files';
import { bulkDeleteFiles, exportFiles, moveFiles } from '@/src/app/[lang]/files/actions';
import FileManager from '@/src/components/Common/FileManager/FileManager';
import { getFormDataForImport } from '@/src/components/EntityListView/HeaderButtons/utils';
import { ROOT_FOLDER } from '@/src/constants/file';
import { MenuI18nKey } from '@/src/constants/i18n';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ImportData } from '@/src/models/import-asset';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { FILES_GRID_COLUMNS } from './constants';
import { changeFolder, createFolderWithFiles, removeFolder } from '@/src/app/[lang]/folders-storage/actions';
import { createEmptyFile } from '@/src/components/Common/FileManager/utils';
import { ServerActionResponse } from '@/src/models/server-action';
import { ResourceType } from '@/src/types/resource-type';
import { downloadFile } from '@/src/utils/download';
import { getDeleteNotificationContent, getExportNotificationContent, getImportNotificationContent } from '../utils';
import Modals from '@/src/components/Assets/BaseAssetList/Modals';
import { ModalType } from '@/src/components/Assets/BaseAssetList/types';

const FilesList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importFolder, setImportFolder] = useState<DialFile | null>(null);
  const [dragAndDropsItems, setDragAndDropsItems] = useState<File[]>([]);
  const [movingItems, setMovingItems] = useState(0);
  const [movedItems, setMovedItems] = useState(0);
  const [folderToRefetch, setFolderToRefetch] = useState<string | null>(null);
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [destinationFolder, setDestinationFolder] = useState<string | null>(null);
  const [deletedItems, setDeletedItems] = useState<DialFile[] | null>(null);

  const { fetchFiles } = useFileFolder();
  const t = useI18n();
  const { showNotification } = useNotification();

  const handleImportModalOpen = useCallback((_?: string, currentFolder?: DialFile, preselectedItems?: File[]) => {
    setIsModalOpen(true);
    setImportFolder(currentFolder || null);
    setDragAndDropsItems(preselectedItems || []);
    setModalType(ModalType.import);
  }, []);

  const handleDeleteModalOpen = useCallback((items: DialFile[], parentFolderPath: string) => {
    setDestinationFolder(parentFolderPath);
    setDeletedItems(items);
    setIsModalOpen(true);
    setModalType(ModalType.delete);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setImportFolder(null);
    setDragAndDropsItems([]);
    setModalType(null);
  }, []);

  const onImport = useCallback(
    (
      fileType: ImportFileType,
      file: ImportData,
      conflictResolutionStrategy: string,
      _: string,
      ignorePaths?: boolean,
    ) => {
      let destinationFolder = importFolder?.path ? importFolder.path : `${ROOT_FOLDER}/`;
      setFolderToRefetch(destinationFolder);

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
        setFolderToRefetch(null);
        const importResults = res.success ? res.response?.importResults : undefined;

        if (res.success) {
          fetchFiles?.(destinationFolder);
          const { title, description, errorTitle, errorDescription, skippedTitle, skippedDescription } =
            getImportNotificationContent(ApplicationRoute.Files, importResults, fileType, destinationFolder, t);
          if (title && description) {
            showNotification(getSuccessNotification(title, description));
          }
          if (errorTitle && errorDescription) {
            showNotification(getErrorNotification(errorTitle, errorDescription));
          }
          if (skippedTitle && skippedDescription && conflictResolutionStrategy !== ConflictResolutionPolicy.SKIP) {
            showNotification(getErrorNotification(skippedTitle, skippedDescription));
          }
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });

      handleModalClose();
    },
    [importFolder?.path, handleModalClose, fetchFiles, showNotification, t],
  );

  const handleCreateFolder = useCallback(async (_: DialUploadFileItem | undefined, folderPath: string) => {
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
      ApplicationRoute.Files,
    ).body;

    return createFolderWithFiles(body, ImportFileType.FILES, ApplicationRoute.Files);
  }, []);

  const handleDeleteItems = useCallback(async () => {
    if (deletedItems?.length) {
      const files = deletedItems.filter((file) => file.nodeType === DialFileNodeType.ITEM);
      const folders = deletedItems.filter((file) => file.nodeType === DialFileNodeType.FOLDER);

      const promises: Promise<ServerActionResponse | ServerActionResponse[]>[] = [];
      if (files.length > 0) {
        const filePaths = files.map((file) => ({
          path: file.path,
          etag: (file as DialFile & { etag?: string }).etag || '',
        }));
        promises.push(bulkDeleteFiles(filePaths));
      }
      folders.forEach((folder) => {
        promises.push(removeFolder(folder.path));
      });

      handleModalClose();

      return Promise.all(promises).then((result) => {
        const isSuccess = result.every((res) => (Array.isArray(res) ? res.every((r) => r.success) : res.success));
        if (isSuccess) {
          const parentPath = destinationFolder || `${ROOT_FOLDER}/`;
          fetchFiles(parentPath);
          const { title, description } = getDeleteNotificationContent(
            ApplicationRoute.Files,
            deletedItems as DialFile[],
            t,
          ) as { title: string; description: string };
          showNotification(getSuccessNotification(title, description));
        } else {
          const errorRes = result.flat().find((res) => !res.success);
          if (errorRes) {
            showNotification(getErrorNotification(errorRes.errorHeader, errorRes.errorMessage, errorRes.requestId));
          }
        }
      });
    }
  }, [deletedItems, handleModalClose, destinationFolder, fetchFiles, showNotification, t]);

  const handleMoveFiles = useCallback(
    async (items: DialCopiedItem[], sourceFolder: string, destinationFolder: string) => {
      const files = items.filter((file) => file.nodeType === DialFileNodeType.ITEM);
      const folders = items.filter((file) => file.nodeType === DialFileNodeType.FOLDER);
      setMovingItems((files?.length || 0) + (folders?.length || 0));
      setMovedItems(0);

      const promises: Promise<ServerActionResponse | ServerActionResponse[]>[] = [];
      files.forEach((file) => {
        const duplicateName = file.destinationUrl
          .split('/')
          .filter((p) => p != null)
          .pop();

        if (sourceFolder !== destinationFolder) {
          // Move file
          const newPath = file.destinationUrl.replaceAll('//', '/').split('/').slice(0, -1).join('/');
          promises.push(
            moveFiles([file.sourceUrl.replaceAll('//', '/')], newPath, file?.overwrite, duplicateName).then((res) => {
              setMovedItems((prev) => prev + 1);
              return res;
            }),
          );
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
            folder?.overwrite,
          ).then((res) => {
            setMovedItems((prev) => prev + 1);
            return res;
          }),
        );
      });

      return Promise.all(promises);
    },
    [],
  );

  const onExport = useCallback(
    (files: DialFile[]) => {
      const filePaths = files.map((file) => file.path);

      return exportFiles(filePaths).then((res) => {
        const { blob, fileName } = res as { blob: Blob; fileName: string };
        downloadFile(blob, fileName);

        const { title, description } = getExportNotificationContent(ApplicationRoute.Files, files, t);
        showNotification(getSuccessNotification(title, description));
      });
    },
    [showNotification, t],
  );

  return (
    <>
      <FileManager
        label={t(MenuI18nKey.Files)}
        columnDefs={FILES_GRID_COLUMNS}
        customUploadFileAction={handleImportModalOpen}
        customDeleteItemsAction={handleDeleteModalOpen}
        getContext={() => useFileFolder()}
        onCreateFolder={handleCreateFolder}
        onMoveItems={handleMoveFiles}
        onExport={onExport}
        view={ApplicationRoute.Files}
        movingItems={movingItems}
        movedItems={movedItems}
        folderToRefetch={folderToRefetch}
      />
      <Modals
        view={ApplicationRoute.Files}
        getContext={() => useFileFolder()}
        isModalOpen={isModalOpen}
        modalType={modalType}
        onImport={onImport}
        onClose={handleModalClose}
        preselectedItems={dragAndDropsItems}
        deletedItems={deletedItems}
        onRemove={handleDeleteItems}
        hasSelectedItems={false}
      />
    </>
  );
};

export default FilesList;
