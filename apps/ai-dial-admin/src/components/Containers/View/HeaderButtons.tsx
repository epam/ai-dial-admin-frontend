import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import classNames from 'classnames';
import { IconPlayerPause, IconPlayerPlay, IconPlus, IconTrashX } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { ButtonVariant, DialButton, DialButtonDropdown, DialSwitch, DropdownItem } from '@epam/ai-dial-ui-kit';
import { ApplicationRoute } from '@/src/types/routes';
import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { ServerActionResponse } from '@/src/models/server-action';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { CONTAINER_STATUS, CONTAINER_TRANSPORT } from '@/src/types/deployments/containers';
import { Container } from '@/src/models/deployments/containers';
import { useI18n } from '@/src/locales/client';
import { useNotification } from '@/src/context/NotificationContext';
import { useAppContext } from '@/src/context/AppContext';
import { ModalType } from '@/src/components/EntityListView/Components/Modals';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { deleteContainer, runContainer, stopContainer } from '@/src/app/actions/deployments';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { ButtonsI18nKey, ContainersI18nKey, CreateI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { getTranslatedEntity, getTranslatedType } from '@/src/utils/deployments/entity';
import { validateContainer } from '@/src/utils/deployments/containers';
import { getAdminAssetPath, getAdminEntityPath } from '@/src/utils/deployments/grid';
import { addTrailingSlash } from '@/src/utils/url';
import { DialModel } from '@/src/models/dial/model';
import { Toolset } from '@/src/models/dial/toolset';
import { DialInterceptor } from '@/src/models/dial/interceptor';
import { showEditorErrorNotifications } from '@/src/components/EntityView/JsonEditor/utils';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { createPortal } from 'react-dom';
import DeleteModal from '@/src/components/Common/DeploymentsModals/Delete';
import CreateEntityModal from '@/src/components/Containers/Modals/CreateEntity';
import CreateAssetModal from '@/src/components/Containers/Modals/CreateAsset';

interface Props<T> {
  route: ApplicationRoute;
  container: T;
  isChanged: boolean;
  jsonEditorEnabled: boolean;
  jsonErrors: JSONEditorError[] | null;
  hideJsonEditor?: boolean;
  children?: ReactNode;
  onDiscard: () => void;
  onSave: () => void;
  toggleJsonEditor?: () => void;
  setErrorNotifications?: (notification: JSONEditorErrorNotification[]) => void;
  names: string[];
  createEntity: (entity: BaseEntity) => Promise<ServerActionResponse>;
  createEntityAsAsset?: (entity: AssetToolset) => Promise<ServerActionResponse>;
  entityNames: string[];
  transport?: CONTAINER_TRANSPORT;
}

const HeaderButtons = <T extends Container>({
  route,
  container,
  isChanged,
  onDiscard,
  onSave,
  jsonEditorEnabled,
  toggleJsonEditor,
  jsonErrors,
  setErrorNotifications,
  hideJsonEditor,
  children,
  names,
  createEntity,
  createEntityAsAsset,
  entityNames,
  transport,
}: Props<T>) => {
  const t = useI18n() as (key: string, options?: Record<string, string | number>) => string;
  const router = useRouter();
  const { showNotification } = useNotification();
  const { visualizerConnector } = useAppContext();
  const visualizerConnectorRef = useRef(visualizerConnector);

  const [modalType, setModalType] = useState<ModalType>();
  const [isValidJSON, setIsValidJSON] = useState<boolean>(true);

  const staticContainerClassnames = 'flex flex-row gap-3 divide-x divide-primary';
  const staticEditorClassNames = 'pl-6';
  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [containerClassNames, setContainerClassNames] = useState(staticContainerClassnames);
  const [buttonsClassNames, setButtonsClassNames] = useState('');
  const [editorClassNames, setEditorClassNames] = useState(staticEditorClassNames);

  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleRunContainer = useCallback(() => {
    if (container.id) {
      runContainer(container.id).then((res) => {
        if (res.success) {
          router.refresh();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    }
  }, [container, router, showNotification]);

  const handleStopContainer = useCallback(() => {
    if (container.id) {
      stopContainer(container.id).then((res) => {
        if (res.success) {
          router.refresh();
          showNotification(
            getSuccessNotification(
              t(ContainersI18nKey.ContainerStopSuccess, { type: getTranslatedType(route, t) }),
              t(ContainersI18nKey.ContainerSuccessDescription),
              5000,
            ),
          );
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    }
  }, [container, route, router, showNotification, t]);

  const isValidEntity = () => {
    return validateContainer(container, route, names);
  };

  const onDelete = useCallback(() => {
    if (container.id) {
      deleteContainer(container.id).then((res) => {
        if (res.success) {
          onCloseModal();
          router.push(route);
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    }
  }, [container.id, onCloseModal, route, router, showNotification]);

  const onCreateEntity = useCallback(
    (entity: DialModel | Toolset | DialInterceptor) => {
      createEntity(entity).then((res) => {
        if (res.success) {
          showNotification(
            getSuccessNotification(t(CreateI18nKey.NotificationTitle, { entity: getTranslatedEntity(route, t) })),
          );
          router.push(getAdminEntityPath(route, entity));
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
      onCloseModal();
    },
    [createEntity, onCloseModal, route, router, showNotification, t],
  );
  const onCreateEntityAsAsset = useCallback(
    (entity: AssetToolset) => {
      const asset = { ...entity, folderId: addTrailingSlash(entity.folderId) };
      createEntityAsAsset?.(asset).then((res) => {
        if (res.success) {
          showNotification(
            getSuccessNotification(t(CreateI18nKey.NotificationTitle, { entity: getTranslatedEntity(route, t) })),
          );

          router.push(getAdminAssetPath(route, asset));
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
      onCloseModal();
    },
    [createEntityAsAsset, onCloseModal, route, router, showNotification, t],
  );

  const onTryToSave = useCallback(() => {
    if (jsonErrors?.length) {
      setIsValidJSON(false);
      const errorNotifications = showEditorErrorNotifications({ errors: jsonErrors, showNotification, t });
      setErrorNotifications?.(errorNotifications);
    } else {
      onSave();
    }
  }, [onSave, setErrorNotifications, showNotification, t, jsonErrors]);

  const onOpenDeleteModal = useCallback(() => {
    onOpenModal(ModalType.delete);
  }, [onOpenModal]);

  const onOpenCreateModal = useCallback(() => {
    onOpenModal(ModalType.createEntity);
  }, [onOpenModal]);

  const onOpenCreteAssetModal = useCallback(() => {
    onOpenModal(ModalType.createAsset);
  }, [onOpenModal]);

  const createToolsetOptions: DropdownItem[] = useMemo(() => {
    return [
      { key: 'toolset', label: t(EntitiesI18nKey.Toolset), onClick: onOpenCreateModal },
      {
        key: 'asset_toolset',
        label: t(EntitiesI18nKey.AssetToolset),
        onClick: onOpenCreteAssetModal,
      },
    ];
  }, [onOpenCreateModal, onOpenCreteAssetModal, t]);

  useEffect(() => {
    setContainerClassNames(
      classNames(
        staticContainerClassnames,
        isTablet || isMobile ? 'fixed bottom-0 left-0 right-0 h-[62px] bg-layer-3 px-6' : '',
      ),
    );
    setButtonsClassNames(classNames(isTablet || isMobile ? 'w-1/2 flex justify-center' : ''));
    setEditorClassNames(
      classNames(
        staticEditorClassNames,
        isTablet ? 'ml-3 pl-3 border-l-tertiary border-l h-full flex items-center' : isMobile ? 'hidden' : '',
      ),
    );
  }, [isTablet, isMobile]);

  useEffect(() => {
    visualizerConnectorRef.current = visualizerConnector;
  }, [visualizerConnector]);

  return (
    <>
      <div className={containerClassNames}>
        {isChanged ? (
          <div className="flex flex-row gap-3 w-full p-3 lg:p-0">
            <DialButton
              variant={ButtonVariant.Secondary}
              className={buttonsClassNames}
              label={t(ButtonsI18nKey.Discard)}
              onClick={onDiscard}
            />
            <DialButton
              variant={ButtonVariant.Primary}
              className={buttonsClassNames}
              label={t(ButtonsI18nKey.Save)}
              onClick={onTryToSave}
              disabled={(jsonEditorEnabled && !isValidJSON) || !isValidEntity()}
            />
          </div>
        ) : (
          <div className="flex flex-row items-center w-full">
            <div className={`flex flex-row gap-3`}>
              {container.status === CONTAINER_STATUS.RUNNING && (
                <>
                  {route === ApplicationRoute.McpDeployments ? (
                    <DialButtonDropdown
                      label={t(ButtonsI18nKey.Create)}
                      items={createToolsetOptions}
                      variant={ButtonVariant.Secondary}
                    />
                  ) : (
                    <DialButton
                      variant={ButtonVariant.Secondary}
                      className={buttonsClassNames}
                      label={t(CreateI18nKey.CreateEntity, { entity: getTranslatedEntity(route, t) })}
                      iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
                      onClick={onOpenCreateModal}
                    />
                  )}
                </>
              )}

              <DialButton
                variant={ButtonVariant.Secondary}
                className={buttonsClassNames}
                label={t(ButtonsI18nKey.Delete)}
                iconBefore={<IconTrashX {...BASE_ICON_PROPS} />}
                onClick={onOpenDeleteModal}
              />
              <>
                {container.status === CONTAINER_STATUS.RUNNING ||
                container.status === CONTAINER_STATUS.PENDING ||
                container.status === CONTAINER_STATUS.FAILED ? (
                  <DialButton
                    variant={ButtonVariant.Secondary}
                    className={buttonsClassNames}
                    label={t(ButtonsI18nKey.Stop)}
                    iconBefore={<IconPlayerPause {...BASE_ICON_PROPS} />}
                    onClick={handleStopContainer}
                  />
                ) : (
                  <DialButton
                    variant={ButtonVariant.Secondary}
                    className={buttonsClassNames}
                    label={t(ButtonsI18nKey.Run)}
                    iconBefore={<IconPlayerPlay {...BASE_ICON_PROPS} />}
                    onClick={handleRunContainer}
                  />
                )}
              </>
              {children}
            </div>
            {!hideJsonEditor && (
              <div className={editorClassNames}>
                <DialSwitch
                  isOn={jsonEditorEnabled}
                  title={t(EntitiesI18nKey.JSONEditor)}
                  switchId="jsonEditor"
                  onChange={toggleJsonEditor}
                />
              </div>
            )}
          </div>
        )}
      </div>
      {isModalOpen &&
        modalType === ModalType.delete &&
        createPortal(
          <DeleteModal
            title={t(ContainersI18nKey.DeleteModalTitle, { type: getTranslatedType(route, t) })}
            description={t(ContainersI18nKey.DeleteModalDescription, { type: getTranslatedType(route, t) })}
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            onApply={onDelete}
            route={route}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.createEntity &&
        createPortal(
          <CreateEntityModal
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            modalTitle={t(CreateI18nKey.CreateEntity, { entity: getTranslatedEntity(route, t) })}
            route={route}
            container={container}
            onCreate={onCreateEntity}
            names={entityNames}
            transport={transport}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.createAsset &&
        createPortal(
          <CreateAssetModal
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            modalTitle={t(CreateI18nKey.CreateEntityAsAsset, { entity: getTranslatedEntity(route, t) })}
            route={route}
            container={container}
            onCreate={onCreateEntityAsAsset}
            names={entityNames}
            transport={transport}
          />,
          document.body,
        )}
    </>
  );
};

export default HeaderButtons;
