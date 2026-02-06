import {
  ButtonAppearance,
  ButtonVariant,
  DialButtonDropdown,
  DialNeutralButton,
  DropdownItem,
} from '@epam/ai-dial-ui-kit';
import { IconPlayerPause, IconPlayerPlay, IconPlus, IconTrashX } from '@tabler/icons-react';
import classNames from 'classnames';
import { useRouter } from 'next/navigation';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { deleteContainer, runContainer, stopContainer } from '@/src/app/actions/deployments';
import CreateAsset from '@/src/components/Assets/Deployments/CreateAsset';
import EntityDelete from '@/src/components/Deployments/Modals/EntityDelete';
import JsonToggles from '@/src/components/EntityHeaderControls/JsonToggle/JsonToggle';
import { ModalType } from '@/src/components/EntityListView/Components/Modals';
import CreateEntity from '@/src/components/EntityListView/CreateEntity/CreateEntity';
import { ButtonsI18nKey, ContainersI18nKey, CreateI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useToolsetFolder } from '@/src/context/assets/ToolsetsFolderContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { Container } from '@/src/models/deployments/containers';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { ServerActionResponse } from '@/src/models/server-action';
import { CONTAINER_STATUS, CONTAINER_TRANSPORT } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import {
  getAssetTemplate,
  getEntityRoute,
  getEntityTemplate,
  getTranslatedDeploymentType,
  getTranslatedEntity,
  getTranslatedType,
} from '@/src/utils/deployments/entity';
import { getErrorNotification } from '@/src/utils/notification';
import { createPortal } from 'react-dom';
import ChangedEntityButtons from '../../EntityHeaderControls/Buttons/ChangedEntityButtons';

interface Props<T> {
  route: ApplicationRoute;
  container: T;
  isChanged: boolean;
  isRedeployRequired: boolean;
  jsonEditorEnabled: boolean;
  hideJsonEditor?: boolean;
  children?: ReactNode;
  onDiscard: () => void;
  onSave: () => void;
  toggleJsonEditor?: () => void;
  createEntity: (entity: BaseEntity) => Promise<ServerActionResponse>;
  createEntityAsAsset?: (entity: AssetWithVersion) => Promise<ServerActionResponse>;
  entityNames: string[];
  transport?: CONTAINER_TRANSPORT;
}

const HeaderButtons = <T extends Container>({
  route,
  container,
  isChanged,
  isRedeployRequired,
  onDiscard,
  onSave,
  jsonEditorEnabled,
  toggleJsonEditor,
  hideJsonEditor,
  children,
  createEntity,
  createEntityAsAsset,
  entityNames,
  transport,
}: Props<T>) => {
  const t = useI18n();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { isValid } = useSaveValidationContext();
  const { visualizerConnector } = useAppContext();
  const visualizerConnectorRef = useRef(visualizerConnector);

  const [modalType, setModalType] = useState<ModalType>();

  const staticContainerClassnames = 'flex flex-row gap-3 divide-x divide-primary';
  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [containerClassNames, setContainerClassNames] = useState(staticContainerClassnames);
  const [buttonsClassNames, setButtonsClassNames] = useState('');

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
    if (container.name) {
      runContainer(container.name).then((res) => {
        if (res.success) {
          router.refresh();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    }
  }, [container, router, showNotification]);

  const handleStopContainer = useCallback(() => {
    if (container.name) {
      stopContainer(container.name).then((res) => {
        if (res.success) {
          router.refresh();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    }
  }, [container, router, showNotification]);

  const onDelete = useCallback(() => {
    if (container.name) {
      deleteContainer(container.name).then((res) => {
        if (res.success) {
          onCloseModal();
          router.push(route);
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage, res.requestId));
        }
      });
    }
  }, [container.name, onCloseModal, route, router, showNotification]);

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
  }, [isTablet, isMobile]);

  useEffect(() => {
    visualizerConnectorRef.current = visualizerConnector;
  }, [visualizerConnector]);

  return (
    <>
      <div className={containerClassNames}>
        {isChanged ? (
          <ChangedEntityButtons
            onDiscard={onDiscard}
            onSave={onSave}
            disableSave={jsonEditorEnabled ? false : !isValid}
            saveLabel={t(isRedeployRequired ? ButtonsI18nKey.SaveAndRedeploy : ButtonsI18nKey.Save)}
          />
        ) : (
          <div className="flex flex-row items-center w-full gap-x-4">
            <div className="flex flex-row gap-3">
              {container.status === CONTAINER_STATUS.RUNNING && (
                <>
                  {route === ApplicationRoute.McpContainers ? (
                    <DialButtonDropdown
                      label={t(ButtonsI18nKey.Create)}
                      items={createToolsetOptions}
                      variant={ButtonVariant.Neutral}
                      appearance={ButtonAppearance.Outlined}
                    />
                  ) : (
                    <DialNeutralButton
                      className={buttonsClassNames}
                      label={t(CreateI18nKey.CreateEntity, { entity: getTranslatedEntity(route, t) })}
                      iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
                      onClick={onOpenCreateModal}
                    />
                  )}
                </>
              )}

              <DialNeutralButton
                className={buttonsClassNames}
                label={t(ButtonsI18nKey.Delete)}
                iconBefore={<IconTrashX {...BASE_BUTTON_ICON_PROPS} />}
                onClick={onOpenDeleteModal}
              />
              <>
                {container.status === CONTAINER_STATUS.RUNNING ||
                container.status === CONTAINER_STATUS.PENDING ||
                container.status === CONTAINER_STATUS.FAILED ? (
                  <DialNeutralButton
                    className={buttonsClassNames}
                    label={t(ButtonsI18nKey.Stop)}
                    iconBefore={<IconPlayerPause {...BASE_BUTTON_ICON_PROPS} />}
                    onClick={handleStopContainer}
                  />
                ) : (
                  <DialNeutralButton
                    className={buttonsClassNames}
                    label={t(ButtonsI18nKey.Run)}
                    iconBefore={<IconPlayerPlay {...BASE_BUTTON_ICON_PROPS} />}
                    onClick={handleRunContainer}
                  />
                )}
              </>
              {children}
            </div>
            {!hideJsonEditor && <JsonToggles isEditorEnabled={jsonEditorEnabled} onToggleEditor={toggleJsonEditor} />}
          </div>
        )}
      </div>
      {isModalOpen &&
        modalType === ModalType.delete &&
        createPortal(
          <EntityDelete
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
      {isModalOpen &&
        modalType === ModalType.createEntity &&
        createPortal(
          <CreateEntity
            route={getEntityRoute(route)}
            isModalOpen={isModalOpen}
            names={entityNames}
            onClose={onCloseModal}
            createEntity={createEntity}
            initialValues={getEntityTemplate(route, container, t, transport)}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.createAsset &&
        createEntityAsAsset &&
        createPortal(
          <CreateAsset
            view={ApplicationRoute.AssetsToolsets}
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            initialValues={getAssetTemplate(route, container, t, transport as CONTAINER_TRANSPORT)}
            onCreate={createEntityAsAsset}
            context={useToolsetFolder}
          />,
          document.body,
        )}
    </>
  );
};

export default HeaderButtons;
