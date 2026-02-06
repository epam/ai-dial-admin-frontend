'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { generateExportList } from '@/src/components/Assets/ExportAssets/export';
import { getDuplicateModal, getExportFunction, getNotificationType } from '@/src/components/EntityListView/utils';
import { getBulkNotificationTitle } from '@/src/components/EntityView/Modals/Delete/utils';
import { ROOT_FOLDER } from '@/src/constants/file';
import { DeleteI18nKey, ExportI18nKey } from '@/src/constants/i18n';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { DialFile } from '@/src/models/dial/file';
import { DialPrompt } from '@/src/models/dial/prompt';
import { ServerActionResponse } from '@/src/models/server-action';
import { ImportFileType } from '@/src/types/import';
import { ApplicationRoute } from '@/src/types/routes';
import { downloadFile, downloadJson } from '@/src/utils/download';
import { getCreateNotificationDescription, getCreateNotificationTitle } from '@/src/utils/entities/create-entity';
import { getListOfPathsToBulkDelete, getListOfPathsToMove } from '@/src/utils/files/path';
import { getJsonFileName } from '@/src/utils/import/get-json-name';
import { isAssetWithVersion } from '@/src/utils/is-asset-view';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import BulkButtons from './BulkButtons';
import Modals, { ModalType } from './Modals';
import { preparePathForAsset } from './utils';
import { Asset } from '@/src/models/dial/deployment-asset';

interface Props<T> {
  names?: string[];
  keys?: string[];
  route: ApplicationRoute;
  versionsMap?: Record<string, string[]>;
  isModalOpen: boolean;
  modalType?: ModalType;
  currentEntity?: T;
  isBulkView?: boolean;

  onChangeIsModalOpen: (value: boolean) => void;
  onChangeModalType: (value?: ModalType) => void;
  onChangeCurrentEntity: (value?: T) => void;
  onChangeIsBulkView: (value: boolean) => void;
  onCreateEntity?: (entity: T, duplicate?: boolean) => Promise<ServerActionResponse>;
  onRemoveEntity: (entity: string) => Promise<ServerActionResponse>;
  onMoveFiles?: (paths: string[], newPath: string) => Promise<ServerActionResponse[]>;
  onBulkDelete?: (paths: { path: string }[]) => Promise<ServerActionResponse>;
  getAssetContext?: () => AssetsFolderContext<Asset>;
}

const Actions = <T extends object>({
  names,
  keys,
  route,
  versionsMap,
  onCreateEntity,
  onRemoveEntity,
  onMoveFiles,
  onBulkDelete,
  getAssetContext,
  isModalOpen,
  modalType,
  currentEntity,
  isBulkView,
  onChangeIsModalOpen,
  onChangeModalType,
  onChangeCurrentEntity,
  onChangeIsBulkView,
}: Props<T>) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const folderContext = getAssetContext?.();
  const getReqRef = useRef(useProtectedRequest());

  const entityRef = useRef(currentEntity);
  const filesRef = useRef(folderContext?.fetchedFoldersData);

  const exportData = useMemo(() => {
    return generateExportList(folderContext?.bulkSelectedData);
  }, [folderContext?.bulkSelectedData]);

  const existingVersions = useMemo(() => {
    if (!versionsMap || !currentEntity) return [];
    const entityName = (currentEntity as BaseEntity)?.name;
    return entityName ? versionsMap[entityName] : [];
  }, [versionsMap, currentEntity]);

  const [duplicateModalContent, setDuplicateModalContent] = useState<ReactNode | null>(null);

  useEffect(() => {
    entityRef.current = currentEntity;
    filesRef.current = folderContext?.fetchedFoldersData;
  }, [currentEntity, folderContext?.fetchedFoldersData]);

  const handleModalClose = useCallback(() => {
    onChangeIsModalOpen(false);
    onChangeModalType(void 0);
  }, [onChangeIsModalOpen, onChangeModalType]);

  const onDuplicate = useCallback(
    (clonedEntity: T) => {
      const duplicate = async () => {
        const preparedEntity = preparePathForAsset(clonedEntity, route);
        const res = await getReqRef.current(onCreateEntity, preparedEntity as T, true);
        if (res?.success) {
          handleModalClose();
          onChangeCurrentEntity(void 0);
          if (isAssetWithVersion(route)) {
            folderContext?.fetchFiles?.(folderContext?.filePath);
          }
          showNotification(
            getSuccessNotification(
              getCreateNotificationTitle(route, t),
              getCreateNotificationDescription(
                route,
                (preparedEntity as { name: string }).name || (preparedEntity as { $id: string }).$id,
                t,
              ),
            ),
          );
          router.push(getUrnForEntity(route, preparedEntity));
          router.refresh();
        } else {
          showNotification(getErrorNotification(res?.errorHeader, res?.errorMessage));
        }
      };
      duplicate();
    },
    [route, onCreateEntity, handleModalClose, onChangeCurrentEntity, showNotification, t, router, folderContext],
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

      onMoveFiles?.(pathsToMove, newPath).then((res) => {
        if (res.every((r) => r.success)) {
          folderContext?.fetchFiles?.(`${ROOT_FOLDER}/`, true);
        }
      });
    },
    [route, folderContext, onMoveFiles],
  );

  const onDeleteBulk = useCallback(() => {
    getReqRef.current(onBulkDelete, getListOfPathsToBulkDelete(folderContext?.bulkSelectedData)).then((res) => {
      if (res.success) {
        showNotification(getSuccessNotification(getBulkNotificationTitle(route, t), t(DeleteI18nKey.ShortDescription)));
        onChangeIsBulkView(false);
        folderContext?.setBulkSelectedData({});
        folderContext?.fetchFiles?.(`${ROOT_FOLDER}/`, true);
        router.refresh();
      }
    });
  }, [onBulkDelete, folderContext, route, router, onChangeIsBulkView, showNotification, t]);

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
            (isAssetWithVersion(route) && exportType === ImportFileType.ARCHIVE)
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
          onChangeIsBulkView(false);
        });
    },
    [exportData, folderContext, handleModalClose, route, onChangeIsBulkView, showNotification, t],
  );

  const getDuplicateModalContent = async () => {
    if (currentEntity) {
      const modal = await getDuplicateModal(
        currentEntity,
        entityRef,
        names || [],
        keys || [],
        route,
        versionsMap || {},
        isModalOpen,
        handleModalClose,
        onDuplicate as (entity: BaseEntity) => Promise<ServerActionResponse>,
        getAssetContext,
      );
      setDuplicateModalContent(modal);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      getDuplicateModalContent();
    } else {
      setDuplicateModalContent(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen]);

  return (
    <>
      {modalType && (isBulkView ? true : currentEntity) ? (
        <Modals
          entity={currentEntity}
          route={route}
          initialPath={(currentEntity as DialPrompt)?.folderId}
          isModalOpen={isModalOpen}
          modalType={modalType}
          duplicateModal={duplicateModalContent}
          onExport={onExport}
          onClose={handleModalClose}
          onRemove={onRemoveEntity}
          onDeleteBulk={onDeleteBulk}
          onMove={onMove}
          getAssetContext={getAssetContext}
          onResetCurrentEntity={() => onChangeCurrentEntity(void 0)}
          existingVersions={existingVersions}
        />
      ) : null}
      {isBulkView && (
        <BulkButtons
          itemsCount={exportData.length}
          route={route}
          getAssetContext={getAssetContext}
          onChangeIsModalOpen={onChangeIsModalOpen}
          onChangeModalType={onChangeModalType}
          onChangeIsBulkView={onChangeIsBulkView}
          onExport={onExport}
        />
      )}
    </>
  );
};

export default Actions;
