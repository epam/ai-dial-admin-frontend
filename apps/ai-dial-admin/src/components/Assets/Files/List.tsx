'use client';

import { useCallback, useState } from 'react';

import { DialCopiedItem, DialDeletedItem, DialFile, DialFileNodeType, DialUploadFileItem } from '@epam/ai-dial-ui-kit';

import { importFiles } from '@/src/utils/files/import-files';
import { bulkDeleteFiles, exportFiles, moveFiles } from '@/src/app/[lang]/files/actions';
import FileManager from '@/src/components/Common/FileManager/FileManager';
import Modals, { ModalType } from '@/src/components/EntityListView/Components/Modals';
import { getFormDataForImport } from '@/src/components/EntityListView/HeaderButtons/utils';
import { ROOT_FOLDER } from '@/src/constants/file';
import { FoldersI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ImportData } from '@/src/models/import-asset';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import {
  bulkActionLabels,
  FILES_GRID_COLUMNS,
  gridActionLabels,
  toolbarOptionLabels,
  treeActionLabels,
} from './constants';
import { changeFolder, createFolderWithFiles, removeFolder } from '@/src/app/[lang]/folders-storage/actions';
import { createEmptyFile } from '../../Common/FileManager/utils';
import { ServerActionResponse } from '@/src/models/server-action';
import { ResourceType } from '@/src/types/resource-type';
import { downloadFile } from '@/src/utils/download';

const FilesList = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importFolder, setImportFolder] = useState<DialFile | null>(null);

  const { fetchFiles } = useFileFolder();
  const t = useI18n();
  const { showNotification } = useNotification();

  const handleModalOpen = useCallback((_?: string, currentFolder?: DialFile) => {
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
      _: string,
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
          fetchFiles?.(destinationFolder);
          showNotification(getSuccessNotification(t(FoldersI18nKey.Import)));
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

  const handleDeleteItems = useCallback(async (fileNodes: DialDeletedItem[]) => {
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

    return Promise.all(promises);
  }, []);

  const handleMoveFiles = useCallback(
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

      return Promise.all(promises);
    },
    [],
  );

  const onExport = useCallback((files: DialFile[]) => {
    const filePaths = files.map((file) => file.path);

    return exportFiles(filePaths).then((res) => {
      const { blob, fileName } = res as { blob: Blob; fileName: string };
      downloadFile(blob, fileName);
    });
  }, []);

  return (
    <>
      <FileManager
        label={t(MenuI18nKey.Files)}
        columnDefs={FILES_GRID_COLUMNS}
        customUploadFileAction={handleModalOpen}
        getContext={() => useFileFolder()}
        onCreateFolder={handleCreateFolder}
        onDeleteItems={handleDeleteItems}
        onMoveItems={handleMoveFiles}
        onExport={onExport}
        view={ApplicationRoute.Files}
        gridActionLabels={gridActionLabels}
        treeActionLabels={treeActionLabels}
        toolbarOptionLabels={toolbarOptionLabels}
        bulkActionLabels={bulkActionLabels}
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
