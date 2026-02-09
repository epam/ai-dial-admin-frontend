'use client';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CellClickedEvent, GridApi, GridOptions } from 'ag-grid-community';
import { useRouter } from 'next/navigation';
import { ApplicationRoute } from '@/src/types/routes';
import { Container } from '@/src/models/deployments/containers';
import { useI18n } from '@/src/locales/client';
import { useNotification } from '@/src/context/NotificationContext';
import { useAppContext } from '@/src/context/AppContext';
import { CONTAINER_STATUS } from '@/src/types/deployments/containers';
import {
  deleteContainer,
  duplicateContainer,
  getContainer,
  runContainer,
  stopContainer,
} from '@/src/app/actions/deployments';
import { ModalType } from '@/src/components/EntityListView/Components/Modals';
import { ServerActionResponse } from '@/src/models/server-action';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { ACTION_COLUMN, ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { Notification } from '@/src/models/notification';
import { ContainersI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { getTranslatedDeploymentType, getTranslatedType } from '@/src/utils/deployments/entity';
import { IMAGE_BUILD_POLL_INTERVAL } from '@/src/constants/deployments/images';
import ListView from '@/src/components/ListView/ListView';
import HeaderButtons from '@/src/components/Containers/List/HeaderButtons';
import ContainerDuplicate from '@/src/components/Deployments/Modals/ContainerDuplicate';
import EntityDeleteModal from '@/src/components/Deployments/Modals/EntityDelete';
import {
  getDeleteOperation,
  getDuplicateOperation,
  getOpenInNewTabOperation,
  getRunOperation,
  getStopOperation,
} from '@/src/constants/grid-columns/actions';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { CONTAINERS_COLUMNS } from '@/src/constants/grid-columns/grid-columns';

interface Props {
  route: ApplicationRoute;
  containersList: Container[];
}

const ContainersList: FC<Props> = ({ route, containersList }) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { visualizerConnector } = useAppContext();
  const visualizerConnectorRef = useRef(visualizerConnector);

  const [names, setNames] = useState(containersList.map((container) => container.name || ''));
  const [currentContainer, setCurrentContainer] = useState<Container | null>(null);
  const [modalType, setModalType] = useState<ModalType>();
  const [showColumnsPanel, setShowColumnsPanel] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [gridApi, setGridApi] = useState<GridApi | null>(null);

  const onGridReady = useCallback((api: GridApi) => {
    setGridApi(api);
  }, []);

  const gridOptions: GridOptions = {
    onCellClicked: (e: CellClickedEvent) => {
      if (e.colDef.field !== ACTIONS_COLUMN_CEL_ID) {
        router.push(getUrnForEntity(route, e.data));
      }
    },
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
      onOpenInNewTab(route, container);
    },
    [route],
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
        setNames((prev) => [...prev, container.name || '']);
        duplicateContainer(currentContainer.name || '', container.name || '', container.displayName || '').then(
          (res) => {
            if (res.success) {
              setCurrentContainer(null);
              router.push(getUrnForEntity(route, res.response));
            } else {
              setNames((prev) => prev.filter((n) => n !== container.name));
              showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
            }
          },
        );
      }
    },
    [currentContainer, route, router, showNotification],
  );

  const onDelete = useCallback(() => {
    if (currentContainer?.name) {
      deleteContainer(currentContainer.name).then(refreshCb(router, showNotification));
    }
  }, [currentContainer, router, showNotification]);

  const columnDefs = [
    ...CONTAINERS_COLUMNS(t, getTranslatedType(route, t), route),
    ACTION_COLUMN([
      getOpenInNewTabOperation(onOpenInNewTabAction),
      getDuplicateOperation(onOpenDuplicateModal),
      getRunOperation(onContainerStatusChange),
      getStopOperation(onContainerStatusChange),
      getDeleteOperation(onOpenDeleteModal),
    ]),
  ];

  const toggleColumnsPanel = () => setShowColumnsPanel(!showColumnsPanel);

  const closeColumnsPanel = useCallback(() => setShowColumnsPanel(false), [setShowColumnsPanel]);

  useEffect(() => {
    visualizerConnectorRef.current = visualizerConnector;
  }, [visualizerConnector]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const pendingContainers = containersList.filter(
      (c) => c.status === CONTAINER_STATUS.PENDING || c.status === CONTAINER_STATUS.STOPPING,
    );

    if (pendingContainers.length) {
      interval = setInterval(async () => {
        const results = (await Promise.allSettled(pendingContainers.map((c) => getContainer(c?.name as string)))) || [];

        results.forEach((res) => {
          if (res.status === 'fulfilled') {
            const container = res.value.response as Container;
            if (container?.status !== CONTAINER_STATUS.PENDING && container?.status !== CONTAINER_STATUS.STOPPING) {
              if (container?.status === CONTAINER_STATUS.RUNNING) {
                showNotification(
                  getSuccessNotification(
                    t(ContainersI18nKey.ContainerRunSuccess, {
                      type: getTranslatedType(route, t),
                      entityType: getTranslatedDeploymentType(route, t),
                    }),
                    t(ContainersI18nKey.ContainerSuccessDescription),
                    5000,
                  ),
                );
              }
              if (container?.status === CONTAINER_STATUS.FAILED) {
                showNotification(
                  getErrorNotification(
                    t(ContainersI18nKey.ContainerRunFailed, { type: getTranslatedType(route, t) }),
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
                      type: getTranslatedType(route, t),
                      entityType: getTranslatedDeploymentType(route, t),
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
  }, [showNotification, route, t, router, containersList]);

  useEffect(() => {
    window.addEventListener('click', closeColumnsPanel);
    return () => window.removeEventListener('click', closeColumnsPanel);
  }, [closeColumnsPanel]);

  return (
    <>
      <ListView
        data={containersList}
        view={route}
        columnDefs={columnDefs}
        additionalGridOptions={gridOptions}
        title={t(ContainersI18nKey.ContainersListTitle, {
          type: getTranslatedType(route, t),
          entityType: getTranslatedDeploymentType(route, t),
        })}
        emptyDataTitle={t(EntitiesI18nKey.NoContainersType, {
          type: getTranslatedType(route, t),
          entityType: getTranslatedDeploymentType(route, t),
        })}
        showColumnsPanel={showColumnsPanel}
        toggleColumnsPanel={toggleColumnsPanel}
        storageKey={`${route}`}
        onGridReady={onGridReady}
      >
        <HeaderButtons
          toggleColumnsPanel={toggleColumnsPanel}
          route={route}
          names={containersList.map((container) => container.name as string) || []}
          gridApi={gridApi}
        />
      </ListView>
      {isModalOpen &&
        modalType === ModalType.duplicate &&
        currentContainer &&
        createPortal(
          <ContainerDuplicate
            title={t(ContainersI18nKey.DuplicateModalTitle, {
              type: getTranslatedType(route, t),
              entityType: getTranslatedDeploymentType(route, t),
            })}
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            onApply={onDuplicate}
            container={currentContainer}
            names={names}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.delete &&
        currentContainer &&
        createPortal(
          <EntityDeleteModal
            title={t(ContainersI18nKey.DeleteModalTitle, {
              type: getTranslatedType(route, t),
              entityType: getTranslatedDeploymentType(route, t),
            })}
            description={t(ContainersI18nKey.DeleteModalDescription, {
              entityType: getTranslatedDeploymentType(route, t),
            })}
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            onApply={onDelete}
            route={route}
          />,
          document.body,
        )}
    </>
  );
};

export default ContainersList;
