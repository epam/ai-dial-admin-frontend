'use client';
import { FC, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';

import { changeFolder, createFolderWithFiles, removeFolder } from '@/src/app/[lang]/folders-storage/actions';
import FilePathModal from '@/src/components/Common/FilePath/FilePathModal';
import FolderCreateModal from '@/src/components/Common/FolderCreate/Components/FolderCreateModal';
import { getResourceTypeByView } from '@/src/components/Common/FolderList/utils';
import { getFormDataForImport, getImportTitle } from '@/src/components/EntityListView/HeaderButtons/utils';
import { getImportResults } from '@/src/components/EntityListView/Import/utils';
import { ROOT_FOLDER } from '@/src/constants/file';
import { BasicI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { DialFolder } from '@/src/models/dial/folder';
import { DialRule } from '@/src/models/dial/rule';
import { ImportResult } from '@/src/models/import';
import { ImportData } from '@/src/models/import-asset';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { findFolderSiblings, getFolderName } from '@/src/utils/files/folder';
import { getFolderNameAndPath } from '@/src/utils/files/path';
import { getSuccessNotification } from '@/src/utils/notification';
import DeleteFolder from './DeleteFolder';
import RenameFolder from './RenameFolder';

export enum ModalType {
  create = 'create',
  rename = 'rename',
  delete = 'delete',
  move = 'move',
}

interface Props {
  isModalOpen: boolean;
  modalType?: ModalType;
  view?: ApplicationRoute;
  selectedFolder?: string;
  handleClose: () => void;
  context?: () => AssetsFolderContext;
}

const FolderListModals: FC<Props> = ({ isModalOpen, modalType, view, selectedFolder = '', handleClose, context }) => {
  const t = useI18n();
  const folderContext = context?.();
  const { showNotification } = useNotification();
  const getReqRef = useRef(useProtectedRequest());

  const onCreateFolder = useCallback(
    (fileType: ImportFileType, file: ImportData, rules: DialRule[], path: string, ignorePaths?: boolean) => {
      const body = getFormDataForImport(
        path,
        file,
        fileType,
        ConflictResolutionPolicy.SKIP,
        rules,
        ignorePaths,
        view,
      ).body;

      getReqRef.current(createFolderWithFiles, body, fileType, view).then((res) => {
        if (res.success) {
          folderContext?.fetchFiles?.(`${ROOT_FOLDER}/`, true);
          const results = (res.response as { importResults: ImportResult[] }).importResults;
          const translatedType = t(getImportTitle(view)).toLowerCase();
          showNotification(getSuccessNotification(t(FoldersI18nKey.FolderCreateSuccess)));
          getImportResults(results, getFolderName(path) as string, translatedType, t, showNotification);
        }
      });
      handleClose();
    },
    [folderContext, handleClose, showNotification, t, view],
  );

  const onRenameFolder = useCallback(
    (newName: string) => {
      handleClose();
      getReqRef.current(changeFolder, selectedFolder, newName, getResourceTypeByView(view)).then((result) => {
        if (result.success) {
          folderContext?.fetchFiles?.(`${getFolderNameAndPath(selectedFolder).path}/`, false, true);
        }
      });
    },
    [folderContext, handleClose, selectedFolder, view],
  );

  const onDeleteFolder = useCallback(() => {
    handleClose();
    getReqRef.current(removeFolder, encodeURIComponent(selectedFolder)).then((result) => {
      if (result.success) {
        folderContext?.fetchFiles?.(`${getFolderNameAndPath(selectedFolder).path}/`, false, true);
      }
    });
  }, [folderContext, handleClose, selectedFolder]);

  const onMoveFolder = useCallback(
    (newName: string) => {
      handleClose();
      getReqRef
        .current(
          changeFolder,
          selectedFolder,
          `${newName}/${getFolderName(selectedFolder)}`,
          getResourceTypeByView(view),
        )
        .then((result) => {
          if (result.success) {
            folderContext?.fetchFiles?.(`${ROOT_FOLDER}/`, true);
          }
        });
    },
    [folderContext, handleClose, selectedFolder, view],
  );

  return (
    <>
      {isModalOpen &&
        modalType === ModalType.create &&
        createPortal(
          <FolderCreateModal
            view={view}
            folderPath={selectedFolder}
            isModalOpen={isModalOpen}
            onClose={handleClose}
            onApply={onCreateFolder}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.rename &&
        createPortal(
          <RenameFolder
            currentPath={selectedFolder}
            siblings={findFolderSiblings(selectedFolder, folderContext?.files[0] as DialFolder)}
            isModalOpen={isModalOpen}
            onClose={handleClose}
            onApply={onRenameFolder}
          />,
          document.body,
        )}

      {isModalOpen &&
        modalType === ModalType.delete &&
        createPortal(
          <DeleteFolder
            view={view}
            isModalOpen={isModalOpen}
            onClose={handleClose}
            onApply={onDeleteFolder}
            context={context}
            selectedFolder={selectedFolder}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.move &&
        createPortal(
          <FilePathModal
            modalTitle={t(BasicI18nKey.MoveToFolder)}
            isModalOpen={isModalOpen}
            onClose={handleClose}
            onApply={onMoveFolder}
            initialPath={selectedFolder}
            context={context}
            isFolderMove={true}
          />,
          document.body,
        )}
    </>
  );
};

export default FolderListModals;
