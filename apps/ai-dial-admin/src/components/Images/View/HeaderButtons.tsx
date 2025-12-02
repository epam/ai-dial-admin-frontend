import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import classNames from 'classnames';
import { useRouter } from 'next/navigation';
import { IconBlocks, IconPlus, IconTrashX } from '@tabler/icons-react';
import { ButtonVariant, DialButton, DialSwitch } from '@epam/ai-dial-ui-kit';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { JSONEditorError, JSONEditorErrorNotification } from '@/src/types/editor';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { useI18n } from '@/src/locales/client';
import { useNotification } from '@/src/context/NotificationContext';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { ModalType } from '@/src/components/EntityListView/Components/Modals';
import { Container } from '@/src/models/deployments/containers';
import {
  createContainer,
  createImage,
  deleteImage,
  getImageContainers,
  installImage,
} from '@/src/app/actions/deployments';
import { getTranslatedType } from '@/src/utils/deployments/entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { validateImage } from '@/src/utils/deployments/images';
import { showEditorErrorNotifications } from '@/src/components/EntityView/JsonEditor/utils';
import { ButtonsI18nKey, ContainersI18nKey, CreateI18nKey, EntitiesI18nKey, ImagesI18nKey } from '@/src/constants/i18n';
import Page403 from '@/src/components/Page403/Page403';
import VersionsSelect from '@/src/components/Common/VersionsSelect/VersionsSelect';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import Delete from '@/src/components/Common/DeploymentsModals/Delete';
import CreateContainer from '@/src/components/Images/Modals/CreateContainer';
import NewVersion from '@/src/components/Images/Modals/NewVersion';
import Install from '@/src/components/Images/Modals/Install';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { DEPLOYMENT_ENTITY } from '@/src/models/deployments';

interface Props {
  route: ApplicationRoute;
  image: Image;
  isChanged: boolean;
  jsonEditorEnabled: boolean;
  jsonErrors: JSONEditorError[] | null;
  hideJsonEditor?: boolean;
  children?: ReactNode;
  onDiscard: () => void;
  onSave: () => void;
  toggleJsonEditor?: () => void;
  setErrorNotifications?: (notification: JSONEditorErrorNotification[]) => void;
  status?: IMAGE_STATUS;
  imagesNames: string[];
  containerNames: string[];
  versions: ImageVersion[];
}

const HeaderButtons: FC<Props> = ({
  route,
  image,
  isChanged,
  onDiscard,
  onSave,
  jsonEditorEnabled,
  toggleJsonEditor,
  jsonErrors,
  setErrorNotifications,
  hideJsonEditor,
  children,
  status,
  containerNames,
  versions,
}) => {
  const t = useI18n() as (key: string, options?: Record<string, string | number>) => string;
  const { showNotification } = useNotification();
  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const router = useRouter();

  const staticContainerClassnames = 'flex flex-row gap-3 divide-x divide-primary';
  const staticEditorClassNames = 'pl-6';

  const [modalType, setModalType] = useState<ModalType>();
  const [isValidJSON, setIsValidJSON] = useState<boolean>(true);
  const [containerClassNames, setContainerClassNames] = useState(staticContainerClassnames);
  const [buttonsClassNames, setButtonsClassNames] = useState('');
  const [editorClassNames, setEditorClassNames] = useState(staticEditorClassNames);
  const [dependencies, setDependencies] = useState<Container[]>([]);
  const [forbidden, setForbidden] = useState(false);

  const allowEditing = useMemo(() => {
    return status !== IMAGE_STATUS.BUILT && status !== IMAGE_STATUS.BUILDING;
  }, [status]);

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

  const onInstallImage = useCallback(
    (image: Image) => {
      installImage(image.id).then((res) => {
        if (res.success) {
          router.refresh();
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [router, showNotification],
  );

  const isValidEntity = () => {
    return validateImage(image);
  };

  const onDelete = useCallback(() => {
    deleteImage(image.id).then((res) => {
      if (res.success) {
        onCloseModal();
        router.push(route);
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [image.id, onCloseModal, route, router, showNotification]);

  const onOpenDeleteModal = useCallback(() => {
    onOpenModal(ModalType.delete);
  }, [onOpenModal]);

  const onOpenCreateModal = useCallback(() => {
    onOpenModal(ModalType.create);
  }, [onOpenModal]);

  const onOpenSaveNewVersionModal = useCallback(() => {
    onOpenModal(ModalType.saveNewVersion);
  }, [onOpenModal]);

  const onOpenCreteNewVersionModal = useCallback(() => {
    onOpenModal(ModalType.createNewVersion);
  }, [onOpenModal]);

  const onOpenInstallModal = useCallback(() => {
    onOpenModal(ModalType.install);
  }, [onOpenModal]);

  const onTryToSave = useCallback(() => {
    if (jsonErrors?.length) {
      setIsValidJSON(false);
      const errorNotifications = showEditorErrorNotifications({ errors: jsonErrors, showNotification, t });
      setErrorNotifications?.(errorNotifications);
    } else {
      onSave();
    }
  }, [onSave, setErrorNotifications, showNotification, t, jsonErrors]);

  const onCreateContainer = useCallback(
    (container: Container) => {
      createContainer(container).then((res) => {
        if (res.success) {
          //navigateToEntity(res, route, visualizerConnectorRef, ENTITY_TYPE.containers);
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [showNotification],
  );

  const onSaveAsNewVersion = useCallback(
    (image: Image) => {
      createImage(image).then((res) => {
        if (res.success) {
          const type = getTranslatedType(route, t);
          showNotification(
            getSuccessNotification(
              t(ImagesI18nKey.ImagesSaveSuccess, { type }),
              t(ImagesI18nKey.ImagesSaveSuccessDescription, { type, version: image.version }),
            ),
          );
          //navigateToEntity(res, route, visualizerConnectorRef, ENTITY_TYPE.images);
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [route, showNotification, t],
  );

  const onVersionChange = useCallback(
    (id: string) => {
      router.push(getUrnForEntity(route, { id }, DEPLOYMENT_ENTITY.images));
    },
    [route, router],
  );

  useEffect(() => {
    if (image) {
      const fetchDependencies = async () => {
        const { response, success, status } = await getImageContainers(image?.id as string);
        if (!success && status === 403) {
          setForbidden(true);
          return;
        }
        setDependencies((response as Container[]) || []);
      };

      fetchDependencies().catch((error) => {
        showNotification(getErrorNotification(error.message));
      });
    }
  }, [image, showNotification]);

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

  if (forbidden) {
    return <Page403 />;
  }

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
              variant={allowEditing ? ButtonVariant.Secondary : ButtonVariant.Primary}
              className={buttonsClassNames}
              label={t(ButtonsI18nKey.SaveAsNewVersion)}
              onClick={onOpenSaveNewVersionModal}
            />
            {allowEditing && (
              <DialButton
                variant={ButtonVariant.Primary}
                className={buttonsClassNames}
                label={t(ButtonsI18nKey.Save)}
                onClick={onTryToSave}
                disabled={(jsonEditorEnabled && !isValidJSON) || !isValidEntity()}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-row items-center w-full">
            <div className={`flex-1 flex flex-row gap-3`}>
              <VersionsSelect
                selected={image.id}
                versions={versions}
                onChange={onVersionChange}
                onClick={onOpenCreteNewVersionModal}
              />
              <DialButton
                variant={ButtonVariant.Secondary}
                className={buttonsClassNames}
                label={t(ButtonsI18nKey.Delete)}
                iconBefore={<IconTrashX {...BASE_ICON_PROPS} />}
                onClick={onOpenDeleteModal}
              />
              {image.buildStatus === IMAGE_STATUS.BUILT && (
                <DialButton
                  variant={ButtonVariant.Secondary}
                  className={buttonsClassNames}
                  label={t(CreateI18nKey.CreateContainer, { type: getTranslatedType(route, t) })}
                  iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
                  onClick={onOpenCreateModal}
                />
              )}
              {allowEditing && (
                <DialButton
                  variant={ButtonVariant.Secondary}
                  className={buttonsClassNames}
                  label={t(ButtonsI18nKey.Install)}
                  iconBefore={<IconBlocks {...BASE_ICON_PROPS} />}
                  onClick={onOpenInstallModal}
                  disabled={status === IMAGE_STATUS.BUILDING}
                />
              )}
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
          <Delete
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            onApply={onDelete}
            dependencies={dependencies}
            title={t(ImagesI18nKey.DeleteModalTitle, { type: getTranslatedType(route, t) })}
            description={t(ImagesI18nKey.DeleteModalDescription, { type: getTranslatedType(route, t) })}
            route={route}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.create &&
        createPortal(
          <CreateContainer
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            modalTitle={t(ContainersI18nKey.CreateModalTitle, { type: getTranslatedType(route, t) })}
            route={route}
            image={image}
            onCreate={onCreateContainer}
            names={containerNames}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.saveNewVersion &&
        createPortal(
          <NewVersion
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            okLabel={t(ButtonsI18nKey.Save)}
            title={t(ImagesI18nKey.SaveNewVersionModalTitle)}
            image={image}
            onApply={onSaveAsNewVersion}
            versions={versions}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.createNewVersion &&
        createPortal(
          <NewVersion
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            okLabel={t(ButtonsI18nKey.Create)}
            title={t(ImagesI18nKey.CreateNewVersionModalTitle)}
            image={image}
            onApply={onSaveAsNewVersion}
            versions={versions}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.install &&
        createPortal(
          <Install
            image={image}
            title={t(ImagesI18nKey.InstallModalTitle, { type: getTranslatedType(route, t) })}
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            onApply={onInstallImage}
          />,
          document.body,
        )}
    </>
  );
};

export default HeaderButtons;
