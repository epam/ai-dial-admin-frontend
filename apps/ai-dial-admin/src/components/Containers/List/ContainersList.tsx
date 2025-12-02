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
import { CONTAINERS_COLUMNS } from '@/src/constants/deployments/containers';
import { ACTION_COLUMN, ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';
import { Notification } from '@/src/models/notification';
import { ContainersI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { getTranslatedType } from '@/src/utils/deployments/entity';
import { IMAGE_BUILD_POLL_INTERVAL } from '@/src/constants/deployments/images';
import ListView from '@/src/components/ListView/ListView';
import HeaderButtons from '@/src/components/Containers/List/HeaderButtons';
import Duplicate from '@/src/components/Common/DeploymentsModals/Duplicate';
import Delete from '@/src/components/Common/DeploymentsModals/Delete';
import {
  getDeleteOperation,
  getDeployOperation,
  getDuplicateOperation,
  getOpenInNewTabOperation,
  getStopOperation,
} from '@/src/constants/grid-columns/actions';
import { getUrnForEntity, onOpenInNewTab } from '@/src/utils/open-in-new-tab';
import { DEPLOYMENT_ENTITY } from '@/src/models/deployments';

interface Props {
  route: ApplicationRoute;
  containersList: Container[];
}

const ContainersList: FC<Props> = ({ route, containersList }) => {
  const t = useI18n() as (key: string, param?: unknown) => string;
  const router = useRouter();
  const { showNotification } = useNotification();
  const { visualizerConnector } = useAppContext();
  const visualizerConnectorRef = useRef(visualizerConnector);

  const [names, setNames] = useState(containersList.map((container) => container.name));
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
        router.push(getUrnForEntity(route, e.data, DEPLOYMENT_ENTITY.containers));
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
      onOpenInNewTab(route, container, DEPLOYMENT_ENTITY.containers);
    },
    [route],
  );

  const onContainerStatusChange = useCallback(
    (container?: Container) => {
      if (container?.id) {
        if (
          container.status !== CONTAINER_STATUS.RUNNING &&
          container.status !== CONTAINER_STATUS.PENDING &&
          container.status !== CONTAINER_STATUS.FAILED
        ) {
          runContainer(container.id).then(refreshCb(router, showNotification));
        } else {
          stopContainer(container.id).then(refreshCb(router, showNotification));
        }
      }
    },
    [router, showNotification],
  );

  const onDuplicate = useCallback(
    (name: string) => {
      if (currentContainer) {
        setNames((prev) => [...prev, name]);
        duplicateContainer(currentContainer.id as string, name).then((res) => {
          if (res.success) {
            router.refresh();
            setCurrentContainer(null);
          } else {
            setNames((prev) => prev.filter((n) => n !== name));
            showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
          }
        });
      }
    },
    [currentContainer, router, showNotification],
  );

  const onDelete = useCallback(() => {
    if (currentContainer?.id) {
      deleteContainer(currentContainer.id).then(refreshCb(router, showNotification));
    }
  }, [currentContainer, router, showNotification]);

  const columnDefs = [
    ...CONTAINERS_COLUMNS(t),
    ACTION_COLUMN([
      getOpenInNewTabOperation(onOpenInNewTabAction),
      getDuplicateOperation(onOpenDuplicateModal),
      getDeployOperation(onContainerStatusChange),
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

    const pendingContainers = containersList.filter((c) => c.status === CONTAINER_STATUS.PENDING);

    if (pendingContainers.length) {
      interval = setInterval(async () => {
        const results = (await Promise.allSettled(pendingContainers.map((c) => getContainer(c?.id as string)))) || [];

        results.forEach((res) => {
          if (res.status === 'fulfilled') {
            const container = res.value.response as Container;
            if (container?.status !== CONTAINER_STATUS.PENDING) {
              if (container?.status === CONTAINER_STATUS.RUNNING) {
                showNotification(
                  getSuccessNotification(
                    t(ContainersI18nKey.ContainerRunSuccess, { type: getTranslatedType(route, t) }),
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
                    '5000', //TODO: DEPLOYMENTS
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
          count: containersList.length,
          type: getTranslatedType(route, t),
        })}
        emptyDataTitle={t(EntitiesI18nKey.NoContainers, { type: getTranslatedType(route, t) })}
        showColumnsPanel={showColumnsPanel}
        toggleColumnsPanel={toggleColumnsPanel}
        storageKey={`${route}/${DEPLOYMENT_ENTITY.containers}`}
        onGridReady={onGridReady}
      >
        <HeaderButtons
          toggleColumnsPanel={toggleColumnsPanel}
          route={route}
          names={containersList.map((container) => container.name) || []}
          gridApi={gridApi}
        />
      </ListView>
      {isModalOpen &&
        modalType === ModalType.duplicate &&
        currentContainer &&
        createPortal(
          <Duplicate
            title={t(ContainersI18nKey.DuplicateModalTitle, { type: getTranslatedType(route, t) })}
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            onApply={onDuplicate}
            currentName={currentContainer.name}
            names={names}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.delete &&
        currentContainer &&
        createPortal(
          <Delete
            title={t(ContainersI18nKey.DeleteModalTitle, { type: getTranslatedType(route, t) })}
            description={t(ContainersI18nKey.DeleteModalDescription)}
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
