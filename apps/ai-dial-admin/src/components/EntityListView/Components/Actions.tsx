'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getDuplicateModal } from '@/src/components/EntityListView/utils';
import { AssetsFolderContext } from '@/src/context/assets/AssetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useProtectedRequest } from '@/src/hooks/use-protected-request';
import { useI18n } from '@/src/locales/client';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getCreateNotificationDescription, getCreateNotificationTitle } from '@/src/utils/entities/create-entity';
import { isAssetWithVersion } from '@/src/utils/is-view';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import Modals, { ModalType } from './Modals';
import { preparePathForAsset } from './utils';

interface Props<T> {
  names?: string[];
  keys?: string[];
  route: ApplicationRoute;
  versionsMap?: Record<string, string[]>;
  isModalOpen: boolean;
  modalType?: ModalType;
  currentEntity?: T;

  onChangeIsModalOpen: (value: boolean) => void;
  onChangeModalType: (value?: ModalType) => void;
  onChangeCurrentEntity: (value?: T) => void;
  onCreateEntity?: (entity: T, duplicate?: boolean) => Promise<ServerActionResponse>;
  onRemoveEntity: (entity: string) => Promise<ServerActionResponse>;
  getAssetContext?: () => AssetsFolderContext;
}

const Actions = <T extends object>({
  names,
  keys,
  route,
  versionsMap,
  onCreateEntity,
  onRemoveEntity,
  getAssetContext,
  isModalOpen,
  modalType,
  currentEntity,
  onChangeIsModalOpen,
  onChangeModalType,
  onChangeCurrentEntity,
}: Props<T>) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const folderContext = getAssetContext?.();
  const getReqRef = useRef(useProtectedRequest());

  const entityRef = useRef(currentEntity);

  const existingVersions = useMemo(() => {
    if (!versionsMap || !currentEntity) return [];
    const entityName = (currentEntity as BaseEntity)?.name;
    return entityName ? versionsMap[entityName] : [];
  }, [versionsMap, currentEntity]);

  const [duplicateModalContent, setDuplicateModalContent] = useState<ReactNode | null>(null);

  useEffect(() => {
    entityRef.current = currentEntity;
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
      {modalType && currentEntity ? (
        <Modals
          entity={currentEntity}
          route={route}
          isModalOpen={isModalOpen}
          modalType={modalType}
          duplicateModal={duplicateModalContent}
          onClose={handleModalClose}
          onRemove={onRemoveEntity}
          getAssetContext={getAssetContext}
          onResetCurrentEntity={() => onChangeCurrentEntity(void 0)}
          existingVersions={existingVersions}
        />
      ) : null}
    </>
  );
};

export default Actions;
