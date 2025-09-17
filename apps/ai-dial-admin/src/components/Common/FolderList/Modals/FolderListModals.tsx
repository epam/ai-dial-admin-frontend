'use client';
import { FC, useCallback } from 'react';
import { createPortal } from 'react-dom';

import { changeFolder, createFolderWithFiles, removeFolder } from '@/src/app/[lang]/folders-storage/actions';
import FilePathModal from '@/src/components/Common/FilePath/FilePathModal';
import FolderCreateModal from '@/src/components/Common/FolderCreate/Components/FolderCreateModal';
import { getFormDataForImport } from '@/src/components/EntityListView/HeaderButtons/utils';
import { BasicI18nKey, FoldersI18nKey } from '@/src/constants/i18n';
import { FileFolderContextType } from '@/src/context/FileFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { PromptFolderContextType } from '@/src/context/PromptFolderContext';
import { RuleFolderContextType } from '@/src/context/RuleFolderContext';
import { useI18n } from '@/src/locales/client';
import { DialFolder } from '@/src/models/dial/folder';
import { DialRule } from '@/src/models/dial/rule';
import { ParsedPrompts } from '@/src/models/prompts';
import { ConflictResolutionPolicy, ImportFileType } from '@/src/types/import';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { findFolderSiblings, getFolderName } from '@/src/utils/files/folder';
import { addTrailingSlash, getFolderNameAndPath } from '@/src/utils/files/path';
import { getSuccessNotification } from '@/src/utils/notification';
import DeleteFolder from './DeleteFolder';
import RenameFolder from './RenameFolder';
import { ResourceType } from '@/src/types/folder';
import { ROOT_FOLDER } from '@/src/constants/file';

export enum ModalType {
  create = 'create',
  rename = 'rename',
  delete = 'delete',
  move = 'move',
}

interface Props {
  modalState: PopUpState;
  modalType?: ModalType;
  view?: ApplicationRoute;
  selectedFolder?: string;
  handleClose: () => void;
  context?: () => PromptFolderContextType | FileFolderContextType | RuleFolderContextType;
}

const FolderListModals: FC<Props> = ({ modalState, modalType, view, selectedFolder = '', handleClose, context }) => {
  const t = useI18n() as (key: string, options?: Record<string, string | number>) => string;
  const folderContext = context?.();
  const { showNotification } = useNotification();

  const createFolder = useCallback(
    (
      fileType: ImportFileType,
      file: File | File[] | ParsedPrompts,
      rules: DialRule[],
      path: string,
      ignorePaths?: boolean,
    ) => {
      const body = getFormDataForImport(path, file, fileType, ConflictResolutionPolicy.SKIP, rules, ignorePaths);

      createFolderWithFiles(body, fileType).then((res) => {
        if (res.success) {
          folderContext?.fetchFiles(`${addTrailingSlash(getFolderNameAndPath(path).path)}`);
          showNotification(getSuccessNotification(t(FoldersI18nKey.FolderCreateSuccess)));
        }
      });
      handleClose();
    },
    [folderContext, handleClose, showNotification, t],
  );

  const renameFolder = useCallback(
    (newName: string) => {
      handleClose();
      changeFolder(
        selectedFolder,
        newName,
        view === ApplicationRoute.Prompts ? ResourceType.PROMPT : ResourceType.FILE,
      ).then((result) => {
        if (result.success) {
          folderContext?.fetchFiles?.(`${getFolderNameAndPath(selectedFolder).path}/`, false, true);
        }
      });
    },
    [folderContext, handleClose, selectedFolder, view],
  );

  const deleteFolder = useCallback(() => {
    handleClose();
    removeFolder(encodeURIComponent(selectedFolder)).then((result) => {
      if (result.success) {
        folderContext?.fetchFiles?.(`${getFolderNameAndPath(selectedFolder).path}/`, false, true);
      }
    });
  }, [folderContext, handleClose, selectedFolder]);

  const moveFolder = useCallback(
    (newName: string) => {
      handleClose();
      changeFolder(
        selectedFolder,
        `${newName}/${getFolderName(selectedFolder)}`,
        view === ApplicationRoute.Prompts ? ResourceType.PROMPT : ResourceType.FILE,
      ).then((result) => {
        if (result.success) {
          folderContext?.fetchFiles?.(`${ROOT_FOLDER}/`, true);
        }
      });
    },
    [folderContext, handleClose, selectedFolder, view],
  );

  return (
    <>
      {modalState === PopUpState.Opened &&
        modalType === ModalType.create &&
        createPortal(
          <FolderCreateModal
            view={view}
            folderPath={selectedFolder}
            modalState={modalState}
            onClose={handleClose}
            onApply={createFolder}
          />,
          document.body,
        )}
      {modalState === PopUpState.Opened &&
        modalType === ModalType.rename &&
        createPortal(
          <RenameFolder
            currentPath={selectedFolder}
            siblings={findFolderSiblings(selectedFolder, folderContext?.files[0] as DialFolder)}
            modalState={modalState}
            onClose={handleClose}
            onApply={renameFolder}
          />,
          document.body,
        )}

      {modalState === PopUpState.Opened &&
        modalType === ModalType.delete &&
        createPortal(
          <DeleteFolder
            modalState={modalState}
            onClose={handleClose}
            onApply={deleteFolder}
            context={context}
            selectedFolder={selectedFolder}
          />,
          document.body,
        )}
      {modalState === PopUpState.Opened &&
        modalType === ModalType.move &&
        createPortal(
          <FilePathModal
            modalTitle={t(BasicI18nKey.MoveToFolder)}
            modalState={modalState}
            onClose={handleClose}
            onApply={moveFolder}
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
