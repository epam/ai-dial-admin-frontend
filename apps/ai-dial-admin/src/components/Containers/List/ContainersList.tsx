'use client';

import { CellClickedEvent, GridOptions } from 'ag-grid-community';
import { useRouter } from 'next/navigation';
import { FC, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  deleteContainer,
  duplicateContainer,
  getContainer,
  runContainer,
  stopContainer,
} from '@/src/app/actions/deployments';
import HeaderButtons from '@/src/components/Containers/List/HeaderButtons';
import ContainerDuplicate from '@/src/components/Deployments/Modals/ContainerDuplicate';
import { ModalType } from '@/src/components/EntityListView/Components/Modals';
import Delete from '@/src/components/EntityView/Modals/Delete/Delete';
import ListEntities from '@/src/components/ListView/List';
import { ACTION_COLUMN } from '@/src/constants/ag-grid';
import { IMAGE_BUILD_POLL_INTERVAL } from '@/src/constants/deployments/images';
import {
  getDeleteOperation,
  getDuplicateOperation,
  getOpenInNewTabOperation,
  getRunOperation,
  getStopOperation,
} from '@/src/constants/grid-columns/actions';
import { CONTAINERS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ContainersI18nKey, EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useI18n } from '@/src/locales/client';
import { Container } from '@/src/models/deployments/containers';
import { Notification } from '@/src/models/notification';
import { ServerActionResponse } from '@/src/models/server-action';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { getContainerKind } from '@/src/utils/deployments/containers';
import { getTranslatedDeploymentType, getTranslatedType } from '@/src/utils/deployments/entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { onCellClicked } from '@/src/components/EntityListView/utils/on-cell-clicked';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

interface Props {
  route: ApplicationRoute;
  containersList: Container[];
  names: string[];
}

const ContainersList: FC<Props> = ({ route, containersList, names }) => {
  const t = useI18n();
  const isUnified = route === ApplicationRoute.Containers;
  // On the unified page the container kind comes from each row's `$type`, not from the route.
  const getKind = useCallback(
    (container?: Container | null): ApplicationRoute => getContainerKind(container?.$type) ?? route,
    [route],
  );
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const router = useRouter();
  const { showNotification } = useNotification();

  const [addedNames, setAddedNames] = useState<string[]>([]);
  const [currentContainer, setCurrentContainer] = useState<Container | null>(null);
  const [modalType, setModalType] = useState<ModalType>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const gridOptions: GridOptions = {
    onCellClicked: (e: CellClickedEvent) => onCellClicked(e, route, router.push),
  };

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleModalOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const onOpenModal = useCallback(
    (modalType: ModalType) => {
      handleModalOpen();
      setModalType(modalType);
    },
    [handleModalOpen],
  );

  const onCloseModal = useCallback(() => {
    handleModalClose();
    setModalType(void 0);
  }, [handleModalClose]);

  const onOpenDeleteModal = useCallback(
    (container?: Container) => {
      if (!currentContainer) {
        setCurrentContainer(container as Container);
        onOpenModal(ModalType.delete);
      }
    },
    [currentContainer, onOpenModal],
  );

  const onOpenDuplicateModal = useCallback(
    (container?: Container) => {
      if (!currentContainer) {
        setCurrentContainer(container as Container);
        onOpenModal(ModalType.duplicate);
      }
    },
    [currentContainer, onOpenModal],
  );

  const refreshCb = (router: AppRouterInstance, showNotification: (config: Notification) => string) => {
    return (res: ServerActionResponse) => {
      if (res.success) {
        router.refresh();
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    };
  };

  const onOpenInNewTabAction = useCallback(
    (container?: Container) => {
      onOpenInNewTab(getKind(container), container);
    },
    [getKind],
  );

  const onContainerStatusChange = useCallback(
    (container?: Container) => {
      if (container?.name) {
        if (
          container.status !== CONTAINER_STATUS.RUNNING &&
          container.status !== CONTAINER_STATUS.PENDING &&
          container.status !== CONTAINER_STATUS.FAILED
        ) {
          runContainer(container.name).then(refreshCb(router, showNotification));
        } else {
          stopContainer(container.name).then(refreshCb(router, showNotification));
        }
      }
    },
    [router, showNotification],
  );

  const onDuplicate = useCallback(
    (container: Container) => {
      if (currentContainer) {
        setAddedNames((prev) => [...prev, container.name || '']);
        duplicateContainer(currentContainer.name || '', container.name || '', container.displayName || '').then(
          (res) => {
            if (res.success) {
              setCurrentContainer(null);
              router.push(getUrnForEntity(getKind(currentContainer), res.response));
            } else {
              setAddedNames((prev) => prev.filter((n) => n !== container.name));
              showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
            }
          },
        );
      }
    },
    [currentContainer, getKind, router, showNotification],
  );

  const duplicateNames = [...names, ...addedNames];

  const columnDefs = [
    ...CONTAINERS_COLUMNS(t, getTranslatedType(route, t), route),
    ACTION_COLUMN(
      isReadOnlyAdmin
        ? [getOpenInNewTabOperation(onOpenInNewTabAction)]
        : [
            getOpenInNewTabOperation(onOpenInNewTabAction),
            getDuplicateOperation(onOpenDuplicateModal),
            getRunOperation(onContainerStatusChange),
            getStopOperation(onContainerStatusChange),
            getDeleteOperation(onOpenDeleteModal),
          ],
    ),
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const pendingContainers = containersList.filter(
      (c) => c.status === CONTAINER_STATUS.PENDING || c.status === CONTAINER_STATUS.STOPPING,
    );

    if (pendingContainers.length) {
      interval = setInterval(async () => {
        const results = (await Promise.allSettled(pendingContainers.map((c) => getContainer(c?.name as string)))) || [];

        results.forEach((res, index) => {
          if (res.status === 'fulfilled') {
            const kind = getKind(pendingContainers[index]);
            const container = res.value.response as Container;
            if (container?.status !== CONTAINER_STATUS.PENDING && container?.status !== CONTAINER_STATUS.STOPPING) {
              if (container?.status === CONTAINER_STATUS.RUNNING) {
                showNotification(
                  getSuccessNotification(
                    t(ContainersI18nKey.ContainerRunSuccess, {
                      type: getTranslatedType(kind, t),
                      entityType: getTranslatedDeploymentType(kind, t),
                    }),
                    t(ContainersI18nKey.ContainerSuccessDescription),
                    5000,
                  ),
                );
              }
              if (container?.status === CONTAINER_STATUS.FAILED) {
                showNotification(
                  getErrorNotification(
                    t(ContainersI18nKey.ContainerRunFailed, { type: getTranslatedType(kind, t) }),
                    '',
                    res.value.requestId,
                    5000,
                  ),
                );
              }
              if (container.status === CONTAINER_STATUS.STOPPED) {
                showNotification(
                  getSuccessNotification(
                    t(ContainersI18nKey.ContainerStopSuccess, {
                      type: getTranslatedType(kind, t),
                      entityType: getTranslatedDeploymentType(kind, t),
                    }),
                    '',
                    5000,
                  ),
                );
              }
              router.refresh();
            }
          }
        });
      }, IMAGE_BUILD_POLL_INTERVAL);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [showNotification, getKind, t, router, containersList]);

  return (
    <>
      <ListEntities
        rowData={containersList}
        columnDefs={columnDefs}
        additionalGridOptions={gridOptions}
        isMainListView
        listLabel={
          isUnified
            ? t(MenuI18nKey.Containers)
            : t(ContainersI18nKey.ContainersListTitle, {
                type: getTranslatedType(route, t),
                entityType: getTranslatedDeploymentType(route, t),
              })
        }
        emptyDataProps={{
          title: isUnified
            ? t(EntitiesI18nKey.NoContainers)
            : t(EntitiesI18nKey.NoContainersType, {
                type: getTranslatedType(route, t),
                entityType: getTranslatedDeploymentType(route, t),
              }),
        }}
        isEnableColumnPanel
        storageKey={route}
        getHref={(data) => getUrnForEntity(route, data)}
      >
        <HeaderButtons route={route} names={names} isReadOnlyAdmin={isReadOnlyAdmin} />
      </ListEntities>
      {isModalOpen &&
        modalType === ModalType.duplicate &&
        currentContainer &&
        createPortal(
          <ContainerDuplicate
            title={t(ContainersI18nKey.DuplicateModalTitle, {
              type: getTranslatedType(getKind(currentContainer), t),
              entityType: getTranslatedDeploymentType(getKind(currentContainer), t),
            })}
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            onApply={onDuplicate}
            container={currentContainer}
            names={duplicateNames}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.delete &&
        currentContainer &&
        createPortal(
          <Delete
            onRemoveEntity={deleteContainer}
            view={getKind(currentContainer)}
            entity={{ ...currentContainer }}
            onCloseModal={onCloseModal}
          />,
          document.body,
        )}
    </>
  );
};

export default ContainersList;
