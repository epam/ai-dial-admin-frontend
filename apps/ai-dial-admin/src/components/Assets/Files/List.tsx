'use client';

import { useCallback, useState } from 'react';

import { DialFile } from '@epam/ai-dial-ui-kit';

import { importFiles } from '@/src/app/[lang]/files/actions';
import FileManager from '@/src/components/Common/FileManager/FileManager';
import Modals, { ModalType } from '@/src/components/EntityListView/Components/Modals';
import { getFormDataForImport } from '@/src/components/EntityListView/HeaderButtons/utils';
import { ROOT_FOLDER } from '@/src/constants/file';
import { FoldersI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useFileFolder } from '@/src/context/assets/FileFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ImportData } from '@/src/models/import-asset';
import { ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { FILES_GRID_COLUMNS } from './constants';

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
          fetchFiles?.(destinationFolder, true);
          showNotification(getSuccessNotification(t(FoldersI18nKey.Import)));
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });

      handleModalClose();
    },
    [importFolder?.path, handleModalClose, fetchFiles, showNotification, t],
  );

  return (
    <>
      <FileManager
        label={t(MenuI18nKey.Files)}
        columnDefs={FILES_GRID_COLUMNS}
        customUploadFileAction={handleModalOpen}
        getContext={() => useFileFolder()}
        view={ApplicationRoute.Files}
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
