'use client';

import { useRouter } from 'next/navigation';
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useRef } from 'react';

import { generateExportList } from '@/src/components/Assets/ExportAssets/export';
import {
  getDuplicateModal,
  getExportFunction,
  getJsonFileName,
  getNotificationType,
} from '@/src/components/EntityListView/utils';
import { ROOT_FOLDER } from '@/src/constants/file';
import { ExportI18nKey, PromptsI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ServerActionResponse } from '@/src/models/server-action';
import { ImportFileType } from '@/src/types/import';
import { PopUpState } from '@/src/types/pop-up';
import { ApplicationRoute } from '@/src/types/routes';
import { downloadFile, downloadJson } from '@/src/utils/download';
import { prepareEntityForDuplicate } from '@/src/components/EntityListView/Components/utils';
import { getListOfPathsToBulkDelete, getListOfPathsToMove } from '@/src/utils/files/path';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import BulkButtons from './BulkButtons';
import Modals, { ModalType } from './Modals';
import { getEntityPath } from '@/src/utils/open-in-new-tab';
import { getCreateNotificationDescription, getCreateNotificationTitle } from '@/src/utils/entities/create-entity';
import { isAssetWithVersion } from '@/src/utils/is-asset-view';

interface Props<T> {
  names?: string[];
  keys?: string[];
  route: ApplicationRoute;
  versionsMap?: Record<string, string[]>;
  createEntity?: (entity: T) => Promise<ServerActionResponse>;
  removeEntity: (entity: string) => Promise<ServerActionResponse>;
  moveFiles?: (paths: string[], newPath: string) => Promise<ServerActionResponse[]>;
  bulkDelete?: (paths: { path: string }[]) => Promise<ServerActionResponse>;
  context?: () => AssetsFolderContext<DialFile>;
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
  const t = useI18n() as (s: string, params?: Record<string, string>) => string;
  const router = useRouter();
  const { showNotification } = useNotification();
  const folderContext = context?.();

  const entityRef = useRef(currentEntity);
  const filesRef = useRef(folderContext?.fetchedFoldersData);

  const exportData = useMemo(() => {
    return generateExportList(folderContext?.bulkSelectedData);
  }, [folderContext?.bulkSelectedData]);

  useEffect(() => {
    entityRef.current = currentEntity;
    filesRef.current = folderContext?.fetchedFoldersData;
  }, [currentEntity, folderContext?.fetchedFoldersData]);

  const handleModalClose = useCallback(() => {
    setModalState(PopUpState.Closed);
    setModalType(void 0);
  }, [setModalState, setModalType]);

  const onDuplicate = useCallback(
    (clonedEntity: T) => {
      const duplicate = async () => {
        const preparedEntity = (await prepareEntityForDuplicate(route, clonedEntity, entityRef)) as T;
        const res = await createEntity?.(preparedEntity);
        if (res?.success) {
          handleModalClose();
          setCurrentEntity(void 0);
          if (isAssetWithVersion(route)) {
            folderContext?.fetchFiles?.(folderContext?.filePath);
          }
          showNotification(
            getSuccessNotification(
              getCreateNotificationTitle(route, t),
              getCreateNotificationDescription(route, (preparedEntity as { name: string }).name, t),
            ),
          );
          router.push(`${route}/${getEntityPath(route, preparedEntity)}`);
          router.refresh();
        } else {
          showNotification(getErrorNotification(res?.errorHeader, res?.errorMessage));
        }
      };
      duplicate();
    },
    [route, createEntity, handleModalClose, setCurrentEntity, showNotification, t, router, folderContext],
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

  const onExport = useCallback(
    (exportType?: ImportFileType) => {
      const type = t(getNotificationType(route));
      const exportFunction = getExportFunction(route);

      exportFunction?.(exportData, exportType)
        .then((res) => {
          showNotification(
            getSuccessNotification(t(ExportI18nKey.SuccessTitle, { type }), t(ExportI18nKey.SuccessDescription)),
          );
          if (
            route === ApplicationRoute.Files ||
            (route === ApplicationRoute.Prompts && exportType === ImportFileType.ARCHIVE)
          ) {
            const { blob, fileName } = res as { blob: Blob; fileName: string };
            downloadFile(blob, fileName);
          } else {
            downloadJson(res, getJsonFileName(route));
          }
        })
        .catch(() => {
          showNotification(
            getErrorNotification(t(ExportI18nKey.ErrorTitle, { type }), t(ExportI18nKey.ErrorDescription)),
          );
        })
        .finally(() => {
          handleModalClose();
          folderContext?.setBulkSelectedData({});
          setIsBulkView(false);
        });
    },
    [exportData, folderContext, handleModalClose, route, setIsBulkView, showNotification, t],
  );

  return (
    <>
      {modalType && (isBulkView ? true : currentEntity) ? (
        <Modals
          entity={currentEntity}
          route={route}
          initialPath={(currentEntity as DialPrompt)?.folderId}
          isModalOpen={modalState === PopUpState.Opened}
          modalType={modalType}
          duplicateModal={getDuplicateModal(
            currentEntity,
            names || [],
            keys || [],
            route,
            versionsMap || {},
            modalState === PopUpState.Opened,
            handleModalClose,
            onDuplicate as (entity: BaseEntity) => Promise<ServerActionResponse>,
            context,
          )}
          handleExport={onExport}
          handleClose={handleModalClose}
          removeEntity={removeEntity}
          handleDeleteBulk={onDeleteBulk}
          handleMove={onMove}
          context={context}
          resetCurrentEntity={() => setCurrentEntity(void 0)}
        />
      ) : null}
      {isBulkView && (
        <BulkButtons
          itemsCount={exportData.length}
          route={route}
          context={context}
          setModalState={setModalState}
          setModalType={setModalType}
          setIsBulkView={setIsBulkView}
          handleExport={onExport}
        />
      )}
    </>
  );
};

export default Actions;
