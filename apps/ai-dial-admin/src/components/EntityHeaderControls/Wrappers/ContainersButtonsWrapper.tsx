import {
  ButtonAppearance,
  ButtonVariant,
  ButtonDropdown,
  DangerButton,
  OutlinedButton,
  DropdownItem,
} from '@epam/ai-dial-ui-kit';
import { IconPlayerPause, IconPlayerPlay, IconPlus, IconTrashX } from '@tabler/icons-react';
import classNames from 'classnames';
import { useRouter } from 'next/navigation';
import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { deleteContainer, runContainer, stopContainer } from '@/src/app/actions/deployments';
import { CreateAssetRoute } from '@/src/components/Assets/BaseAssetList/types';
import { AssetFolderContextMap, CreateAssetActionMap } from '@/src/components/Assets/BaseAssetList/utils';
import CreateAsset from '@/src/components/Assets/Modals/CreateAsset';
import ChangedEntityButtons from '@/src/components/EntityHeaderControls/Buttons/ChangedEntityButtons';
import JsonToggles from '@/src/components/EntityHeaderControls/JsonToggle/JsonToggle';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';
import { ModalType } from '@/src/components/EntityListView/Components/Modals';
import CreateEntity from '@/src/components/EntityListView/CreateEntity/CreateEntity';
import Delete from '@/src/components/EntityView/Modals/Delete/Delete';
import { ButtonsI18nKey, CreateI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import {
  BASE_BUTTON_ICON_PROPS,
  SELECT_ENTITY_HEADER_CLASS,
  SELECT_ENTITY_MOBILE_HEADER_BUTTONS_CLASS,
  SELECT_ENTITY_MOBILE_HEADER_CLASS,
} from '@/src/constants/main-layout';
import { AssetsFolderContextReader } from '@/src/context/assets/AssetsFolderContext';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext, ValidationActionType } from '@/src/context/SaveValidationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { Container } from '@/src/models/deployments/containers';
import { Image } from '@/src/models/deployments/images';
import { BaseEntity } from '@/src/models/dial/base-entity';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { ServerActionResponse } from '@/src/models/server-action';
import { CONTAINER_STATUS, CONTAINER_TRANSPORT, INFERENCE_TASK } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import {
  getAssetTemplate,
  getAssetView,
  getEntityRoute,
  getEntityTemplate,
  getTranslatedAssetEntity,
  getTranslatedAssetOption,
  getTranslatedEntity,
} from '@/src/utils/deployments/entity';
import { isImageNotInstalled } from '@/src/utils/deployments/images';
import { isFlatPlatformView } from '@/src/utils/files/root-folder';
import { getErrorNotification } from '@/src/utils/notification';

export interface ContainersButtonsWrapperProps {
  route: ApplicationRoute;
  container: Container;
  image?: Image;
  isChanged: boolean;
  isRedeployRequired: boolean;
  children?: ReactNode;
  entityNames?: string[];
  jsonConfiguration: JsonConfiguration;
  transport?: CONTAINER_TRANSPORT;

  onDiscard: () => void;
  onSave: () => void;
  createEntity?: (entity: BaseEntity) => Promise<ServerActionResponse>;
  createToolset?: (entity: BaseEntity) => Promise<ServerActionResponse>;
  toolsetNames?: string[];
  assetNames?: string[];
}

const ContainersButtonsWrapper: FC<ContainersButtonsWrapperProps> = ({
  route,
  container,
  image,
  isChanged,
  isRedeployRequired,
  onDiscard,
  onSave,
  jsonConfiguration,
  children,
  createEntity,
  createToolset,
  entityNames,
  toolsetNames,
  assetNames,
  transport,
}) => {
  const t = useI18n();
  const { featureFlags } = useAppContext();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();
  const router = useRouter();
  const { showNotification } = useNotification();
  const { isValid, dispatch } = useSaveValidationContext();

  const [modalType, setModalType] = useState<ModalType>();

  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const [containerClassNames, setContainerClassNames] = useState(SELECT_ENTITY_HEADER_CLASS);
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
    dispatch({ type: ValidationActionType.Reset });
  }, [dispatch, handleModalClose]);

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

  const onOpenDeleteModal = useCallback(() => {
    onOpenModal(ModalType.delete);
  }, [onOpenModal]);

  const onOpenCreateModal = useCallback(() => {
    onOpenModal(ModalType.createEntity);
  }, [onOpenModal]);

  const onOpenCreteAssetModal = useCallback(() => {
    onOpenModal(ModalType.createAsset);
  }, [onOpenModal]);

  useEffect(() => {
    setContainerClassNames(
      classNames(SELECT_ENTITY_HEADER_CLASS, (isTablet || isMobile) && SELECT_ENTITY_MOBILE_HEADER_CLASS),
    );
    setButtonsClassNames(classNames((isTablet || isMobile) && SELECT_ENTITY_MOBILE_HEADER_BUTTONS_CLASS));
  }, [isTablet, isMobile]);

  const onStartDiscard = useCallback(() => {
    dispatch({ type: ValidationActionType.Reset });

    onDiscard?.();
  }, [dispatch, onDiscard]);

  // On the Model-Serving page the backend-detected capability decides what gets created:
  // text-classification -> MCP toolset, text-generation/absent -> model, NONE -> nothing.
  const isModelServing = route === ApplicationRoute.ModelServings;
  const isClassificationToolset =
    isModelServing && container.inferenceTask === INFERENCE_TASK.TEXT_CLASSIFICATION && !!createToolset;
  const isCapabilityBlocked = isModelServing && container.inferenceTask === INFERENCE_TASK.NONE;

  const activeCreateEntity = isClassificationToolset ? createToolset : createEntity;
  const createEntityRoute = isClassificationToolset ? ApplicationRoute.Toolsets : getEntityRoute(route);
  const createEntityNames = isClassificationToolset ? (toolsetNames ?? []) : (entityNames ?? []);
  const createLabelEntity = isClassificationToolset ? t(EntitiesI18nKey.Toolset) : getTranslatedEntity(route, t);

  // The admin-backend entity and the Core asset are two independent creates; without the admin API
  // only the Core one is left, so the dropdown collapses to a plain button.
  const hasAdminCreate = featureFlags.adminApiEnabled && !!activeCreateEntity;
  const isCreateAvailable = container.status === CONTAINER_STATUS.RUNNING && !isCapabilityBlocked;
  const assetView = getAssetView(route, container);
  const assetTemplate = getAssetTemplate(route, container, transport);
  const assetFolderContext = AssetFolderContextMap[
    assetView as keyof typeof AssetFolderContextMap
  ] as () => AssetsFolderContextReader;

  const createOptions: DropdownItem[] = useMemo(() => {
    return [
      { key: 'entity', label: createLabelEntity, onClick: onOpenCreateModal },
      { key: 'asset', label: getTranslatedAssetOption(route, container, t), onClick: onOpenCreteAssetModal },
    ];
  }, [container, createLabelEntity, onOpenCreateModal, onOpenCreteAssetModal, route, t]);

  return (
    <>
      <div className={containerClassNames}>
        {isReadOnlyAdmin ? (
          !jsonConfiguration.hideJsonEditorButton && <JsonToggles {...jsonConfiguration} />
        ) : isChanged ? (
          <ChangedEntityButtons
            onDiscard={onStartDiscard}
            onSave={onSave}
            disableSave={!isValid}
            saveLabel={t(isRedeployRequired ? ButtonsI18nKey.SaveAndRedeploy : ButtonsI18nKey.Save)}
          />
        ) : (
          <div className="flex flex-row items-center w-full gap-x-4">
            {!jsonConfiguration.isEditorEnabled && (
              <div className="flex flex-row gap-3">
                {isCreateAvailable &&
                  (hasAdminCreate ? (
                    <ButtonDropdown
                      label={t(ButtonsI18nKey.Create)}
                      items={createOptions}
                      variant={ButtonVariant.Neutral}
                      appearance={ButtonAppearance.Outlined}
                      disabled={!isValid}
                    />
                  ) : (
                    <OutlinedButton
                      className={buttonsClassNames}
                      label={t(CreateI18nKey.CreateEntity, {
                        entity: getTranslatedAssetEntity(route, container, t),
                      })}
                      iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
                      onClick={onOpenCreteAssetModal}
                      disabled={!isValid}
                    />
                  ))}

                <DangerButton
                  className={buttonsClassNames}
                  label={t(ButtonsI18nKey.Delete)}
                  appearance={ButtonAppearance.Outlined}
                  iconBefore={<IconTrashX {...BASE_BUTTON_ICON_PROPS} />}
                  onClick={onOpenDeleteModal}
                />
                <>
                  {container.status === CONTAINER_STATUS.RUNNING ||
                  container.status === CONTAINER_STATUS.PENDING ||
                  container.status === CONTAINER_STATUS.FAILED ? (
                    <OutlinedButton
                      className={buttonsClassNames}
                      label={t(ButtonsI18nKey.Stop)}
                      iconBefore={<IconPlayerPause {...BASE_BUTTON_ICON_PROPS} />}
                      onClick={handleStopContainer}
                    />
                  ) : (
                    <OutlinedButton
                      className={buttonsClassNames}
                      label={t(ButtonsI18nKey.Run)}
                      iconBefore={<IconPlayerPlay {...BASE_BUTTON_ICON_PROPS} />}
                      onClick={handleRunContainer}
                      disabled={isImageNotInstalled(image)}
                    />
                  )}
                </>
                {children}
              </div>
            )}
            {!jsonConfiguration.hideJsonEditorButton && <JsonToggles {...jsonConfiguration} />}
          </div>
        )}
      </div>
      {isModalOpen &&
        modalType === ModalType.delete &&
        createPortal(
          <Delete
            onRemoveEntity={deleteContainer}
            view={route}
            entity={{ ...container }}
            onCloseModal={onCloseModal}
            isSelectedView={true}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.createEntity &&
        activeCreateEntity &&
        createPortal(
          <CreateEntity
            route={createEntityRoute}
            isModalOpen={isModalOpen}
            names={createEntityNames}
            onClose={onCloseModal}
            createEntity={activeCreateEntity}
            initialValues={getEntityTemplate(route, container, t, transport)}
            isModal
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.createAsset &&
        createPortal(
          // Flat platform types (models, interceptors) go through the same create flow as their
          // Assets list; only the dual-bucket types need the folder-aware asset modal.
          isFlatPlatformView(assetView) ? (
            <CreateEntity
              route={assetView}
              isModalOpen={isModalOpen}
              names={assetNames ?? []}
              onClose={onCloseModal}
              createEntity={CreateAssetActionMap[assetView as CreateAssetRoute]}
              initialValues={assetTemplate as Partial<AssetWithVersion>}
              isModal
            />
          ) : (
            <CreateAsset
              view={assetView}
              isModalOpen={isModalOpen}
              onClose={onCloseModal}
              initialValues={assetTemplate as Partial<AssetWithVersion>}
              context={assetFolderContext}
              isPlatformTarget
            />
          ),
          document.body,
        )}
    </>
  );
};

export default ContainersButtonsWrapper;
