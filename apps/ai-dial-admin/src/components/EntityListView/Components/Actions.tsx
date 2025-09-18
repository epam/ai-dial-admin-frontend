'use client';

import { useRouter } from 'next/navigation';
import { Dispatch, SetStateAction, useCallback, useEffect, useRef } from 'react';

import { getPrompt } from '@/src/app/[lang]/prompts/actions';
import { getDuplicateModal } from '@/src/components/EntityListView/utils';
import { ROOT_FOLDER } from '@/src/constants/file';
import { PromptsI18nKey } from '@/src/constants/i18n';
import { FileFolderContextType } from '@/src/context/FileFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { PromptFolderContextType } from '@/src/context/PromptFolderContext';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ServerActionResponse } from '@/src/models/server-action';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { prepareEntityForDuplicate } from '@/src/utils/entities/prepare-entity-for-duplicate';
import { getListOfPathsToBulkDelete, getListOfPathsToMove } from '@/src/utils/files/path';
import { isAssetView } from '@/src/utils/is-asset-view';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getEntityPath } from '@/src/utils/open-in-new-tab';
import BulkButtons from './BulkButtons';
import Modals, { ModalType } from './Modals';

interface Props<T> {
  names?: string[];
  keys?: string[];
  route: ApplicationRoute;
  versionsMap?: Record<string, string[]>;
  createEntity?: (entity: T) => Promise<ServerActionResponse>;
  removeEntity: (entity?: string) => Promise<ServerActionResponse>;
  moveFiles?: (paths: string[], newPath: string) => Promise<ServerActionResponse[]>;
  bulkDelete?: (paths: { path: string }[]) => Promise<ServerActionResponse>;
  context?: () => PromptFolderContextType | FileFolderContextType;
  modalState: PopUpState;
  modalType?: ModalType;
  currentEntity?: T;
  isBulkView?: boolean;
  setModalState: Dispatch<SetStateAction<PopUpState>>;
  setModalType: Dispatch<SetStateAction<ModalType | undefined>>;
  setCurrentEntity: Dispatch<SetStateAction<T | undefined>>;
  setIsBulkView: Dispatch<SetStateAction<boolean>>;
}

const Actions = <T extends object>({
  names,
  keys,
  route,
  versionsMap,
  createEntity,
  removeEntity,
  moveFiles,
  bulkDelete,
  context,
  modalState,
  modalType,
  currentEntity,
  isBulkView,
  setModalState,
  setModalType,
  setCurrentEntity,
  setIsBulkView,
}: Props<T>) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const folderContext = context?.();

  const entityRef = useRef(currentEntity);
  const filesRef = useRef(folderContext?.fetchedFoldersData);

  useEffect(() => {
    entityRef.current = currentEntity;
    filesRef.current = folderContext?.fetchedFoldersData;
  }, [currentEntity, folderContext?.fetchedFoldersData]);

  const handleModalClose = useCallback(() => {
    setModalState(PopUpState.Closed);
    setModalType(void 0);
  }, [setModalState, setModalType]);

  const onDelete = useCallback(() => {
    removeEntity(getEntityPath(route, currentEntity, true)).then((res) => {
      if (res.success) {
        handleModalClose();
        setCurrentEntity(void 0);
        if (isAssetView(route)) {
          folderContext?.fetchFiles?.(folderContext?.filePath);
        }
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [currentEntity, folderContext, handleModalClose, removeEntity, route, router, setCurrentEntity, showNotification]);

  const onDuplicate = useCallback(
    (clonedEntity: T) => {
      const duplicate = async () => {
        let prevPromptData = null;

        if (route === ApplicationRoute.Prompts) {
          const { folderId, name, version } = entityRef.current as DialPrompt;
          prevPromptData = await getPrompt(folderId, name as string, version);
        }
        const preparedEntity = prepareEntityForDuplicate(route, clonedEntity, prevPromptData) as T;
        const res = await createEntity?.(preparedEntity);
        if (res?.success) {
          handleModalClose();
          setCurrentEntity(void 0);
          if (route === ApplicationRoute.Prompts) {
            folderContext?.fetchFiles?.(folderContext?.filePath);
          }
          router.refresh();
        } else {
          showNotification(getErrorNotification(res?.errorHeader, res?.errorMessage));
        }
      };
      duplicate();
    },
    [route, createEntity, handleModalClose, setCurrentEntity, router, folderContext, showNotification],
  );

  const onMove = useCallback(
    (newPath: string) => {
      if (!entityRef.current) return;
      const pathsToMove = getListOfPathsToMove(
        entityRef.current as DialFile,
        folderContext?.fetchedFoldersData as Record<string, DialFile[]>,
        null,
        route === ApplicationRoute.Files,
      );

      moveFiles?.(pathsToMove, newPath).then((res) => {
        if (res.every((r) => r.success)) {
          folderContext?.fetchFiles?.(`${ROOT_FOLDER}/`, true);
        }
      });
    },
    [route, folderContext, moveFiles],
  );

  const onDeleteBulk = useCallback(() => {
    bulkDelete?.(getListOfPathsToBulkDelete(folderContext?.bulkSelectedData)).then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(t(PromptsI18nKey.DeleteSuccessTitle), t(PromptsI18nKey.DeleteSuccessDescription)),
        );
        setIsBulkView(false);
        folderContext?.setBulkSelectedData({});
        folderContext?.fetchFiles?.(`${ROOT_FOLDER}/`, true);
      }
    });
  }, [bulkDelete, folderContext, setIsBulkView, showNotification, t]);

  return (
    <>
      {modalType && (isBulkView ? true : currentEntity) ? (
        <Modals
          entity={currentEntity}
          route={route}
          initialPath={(currentEntity as DialPrompt)?.folderId}
          modalState={modalState}
          modalType={modalType}
          duplicateModal={getDuplicateModal(
            currentEntity,
            names || [],
            keys || [],
            route,
            versionsMap || {},
            modalState,
            handleModalClose,
            onDuplicate as (entity: BaseEntity) => Promise<ServerActionResponse>,
          )}
          handleClose={handleModalClose}
          handleDelete={onDelete}
          handleDeleteBulk={onDeleteBulk}
          handleMove={onMove}
          context={context}
        />
      ) : null}
      {isBulkView && (
        <BulkButtons
          route={route}
          context={context}
          setModalState={setModalState}
          setModalType={setModalType}
          setIsBulkView={setIsBulkView}
        />
      )}
    </>
  );
};

export default Actions;
