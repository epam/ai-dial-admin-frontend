import { DialNeutralButton, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconBlocks, IconPlus, IconTrashX } from '@tabler/icons-react';
import classNames from 'classnames';
import { useRouter } from 'next/navigation';
import { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { createContainer, createImage, deleteImage, installImage } from '@/src/app/actions/deployments';
import VersionsSelect from '@/src/components/Deployments/Common/VersionsSelect/VersionsSelect';
import EntityDelete from '@/src/components/Deployments/Modals/EntityDelete';
import ImageCreateContainer from '@/src/components/Deployments/Modals/ImageCreateContainer';
import ImageInstall from '@/src/components/Deployments/Modals/ImageInstall';
import ImageNewVersion from '@/src/components/Deployments/Modals/ImageNewVersion';
import JsonToggles from '@/src/components/EntityHeaderControls/JsonToggle/JsonToggle';
import { ModalType } from '@/src/components/EntityListView/Components/Modals';
import { ButtonsI18nKey, ContainersI18nKey, CreateI18nKey, ImagesI18nKey } from '@/src/constants/i18n';
import {
  BASE_BUTTON_ICON_PROPS,
  SELECT_ENTITY_HEADER_CLASS,
  SELECT_ENTITY_MOBILE_HEADER_BUTTONS_CLASS,
  SELECT_ENTITY_MOBILE_HEADER_CLASS,
} from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';
import { useIsOnlyTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { Container } from '@/src/models/deployments/containers';
import { Image, ImageVersion } from '@/src/models/deployments/images';
import { IMAGE_STATUS } from '@/src/types/deployments/images';
import { ApplicationRoute } from '@/src/types/routes';
import { getRouteByType, getTranslatedDeploymentType, getTranslatedType } from '@/src/utils/deployments/entity';
import { validateImage } from '@/src/utils/deployments/images';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { JsonConfiguration } from '@/src/components/EntityHeaderControls/models';

export interface ImagesButtonsWrapperProps {
  image: Image;
  originalImageName: string;
  isChanged: boolean;
  children?: ReactNode;
  containerNames?: string[];
  versions: ImageVersion[];
  dependencies: Container[];
  jsonConfiguration?: JsonConfiguration;

  onDiscard: () => void;
  onSave: () => void;
}

const ImagesButtonsWrapper: FC<ImagesButtonsWrapperProps> = ({
  dependencies,
  image,
  originalImageName,
  isChanged,
  onDiscard,
  onSave,
  children,
  containerNames,
  versions,
  jsonConfiguration,
}) => {
  const t = useI18n();
  const { showNotification } = useNotification();
  const isTablet = useIsOnlyTabletScreen();
  const isMobile = useIsMobileScreen();
  const router = useRouter();
  const { isValid } = useSaveValidationContext();

  const isDisableSave = useMemo(
    () => (jsonConfiguration?.isEditorEnabled ? false : !validateImage(image) || !isValid),
    [jsonConfiguration?.isEditorEnabled, image, isValid],
  );

  const [modalType, setModalType] = useState<ModalType>();
  const [containerClassNames, setContainerClassNames] = useState(SELECT_ENTITY_HEADER_CLASS);
  const [buttonsClassNames, setButtonsClassNames] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const allowEditing = useMemo(() => {
    return image.buildStatus !== IMAGE_STATUS.BUILT && image.buildStatus !== IMAGE_STATUS.BUILDING;
  }, [image.buildStatus]);

  const forceNewVersion = useMemo(() => {
    const isNameChanged = (image.name ?? '').trim() !== (originalImageName ?? '').trim();

    return isNameChanged && versions.some((v: ImageVersion) => v.version === image.version);
  }, [image.name, image.version, originalImageName, versions]);

  const onOpenModal = useCallback((modalType: ModalType) => {
    setIsModalOpen(true);
    setModalType(modalType);
  }, []);

  const onCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setModalType(void 0);
  }, []);

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

  const onDelete = useCallback(() => {
    deleteImage(image.id).then((res) => {
      if (res.success) {
        onCloseModal();
        router.push(ApplicationRoute.Images);
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
    });
  }, [image.id, onCloseModal, router, showNotification]);

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

  const onCreateContainer = useCallback(
    (container: Container) => {
      createContainer(container).then((res) => {
        if (res.success) {
          router.push(getUrnForEntity(getRouteByType(image.$type), res.response));
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [router, showNotification, image.$type],
  );

  const onSaveAsNewVersion = useCallback(
    (image: Image) => {
      createImage(image).then((res) => {
        if (res.success) {
          const type = getTranslatedType(ApplicationRoute.Images, t);
          showNotification(
            getSuccessNotification(
              t(ImagesI18nKey.ImagesSaveSuccess, { type }),
              t(ImagesI18nKey.ImagesSaveSuccessDescription, { type, version: image.version }),
            ),
          );
          router.push(getUrnForEntity(ApplicationRoute.Images, res.response));
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [router, showNotification, t],
  );

  const onVersionChange = useCallback(
    (id: string) => {
      router.push(getUrnForEntity(ApplicationRoute.Images, { id }));
    },
    [router],
  );

  useEffect(() => {
    setContainerClassNames(
      classNames(SELECT_ENTITY_HEADER_CLASS, (isTablet || isMobile) && SELECT_ENTITY_MOBILE_HEADER_CLASS),
    );
    setButtonsClassNames(classNames((isTablet || isMobile) && SELECT_ENTITY_MOBILE_HEADER_BUTTONS_CLASS));
  }, [isTablet, isMobile]);

  return (
    <>
      <div className={containerClassNames}>
        {isChanged ? (
          <div className="flex flex-row gap-3 w-full p-3 lg:p-0">
            <DialNeutralButton className={buttonsClassNames} label={t(ButtonsI18nKey.Discard)} onClick={onDiscard} />
            {allowEditing && !forceNewVersion ? (
              <DialNeutralButton
                className={buttonsClassNames}
                label={t(ButtonsI18nKey.SaveAsNewVersion)}
                onClick={onOpenSaveNewVersionModal}
                disabled={isDisableSave}
              />
            ) : (
              <DialPrimaryButton
                className={buttonsClassNames}
                label={t(ButtonsI18nKey.SaveAsNewVersion)}
                onClick={onOpenSaveNewVersionModal}
                disabled={isDisableSave}
              />
            )}
            {allowEditing && !forceNewVersion && (
              <DialPrimaryButton
                className={buttonsClassNames}
                label={t(ButtonsI18nKey.Save)}
                onClick={onSave}
                disabled={isDisableSave}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-row items-center w-full gap-x-4">
            {!jsonConfiguration?.isEditorEnabled && (
              <div className="flex-1 flex flex-row gap-3">
                <VersionsSelect
                  selected={image.id}
                  versions={versions}
                  onChange={onVersionChange}
                  onClick={onOpenCreteNewVersionModal}
                />
                <DialNeutralButton
                  className={buttonsClassNames}
                  label={t(ButtonsI18nKey.Delete)}
                  iconBefore={<IconTrashX {...BASE_BUTTON_ICON_PROPS} />}
                  onClick={onOpenDeleteModal}
                />
                {image.buildStatus === IMAGE_STATUS.BUILT && (
                  <DialNeutralButton
                    className={buttonsClassNames}
                    label={t(CreateI18nKey.CreateContainer, {
                      type: getTranslatedType(getRouteByType(image.$type), t),
                    })}
                    iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
                    onClick={onOpenCreateModal}
                  />
                )}
                {allowEditing && (
                  <DialNeutralButton
                    className={buttonsClassNames}
                    label={t(ButtonsI18nKey.Install)}
                    iconBefore={<IconBlocks {...BASE_BUTTON_ICON_PROPS} />}
                    onClick={onOpenInstallModal}
                    disabled={image.buildStatus === IMAGE_STATUS.BUILDING}
                  />
                )}
                {children}
              </div>
            )}
            {!jsonConfiguration?.hideJsonEditorButton && <JsonToggles {...jsonConfiguration} />}{' '}
          </div>
        )}
      </div>
      {isModalOpen &&
        modalType === ModalType.delete &&
        createPortal(
          <EntityDelete
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            onApply={onDelete}
            dependencies={dependencies}
            title={t(ImagesI18nKey.DeleteModalTitle, { type: getTranslatedType(getRouteByType(image.$type), t) })}
            description={t(ImagesI18nKey.DeleteModalDescription, {
              type: getTranslatedType(getRouteByType(image.$type), t),
            })}
            route={getRouteByType(image.$type)}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.create &&
        createPortal(
          <ImageCreateContainer
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            modalTitle={t(ContainersI18nKey.CreateModalTitle, {
              type: getTranslatedType(getRouteByType(image.$type), t),
              entityType: getTranslatedDeploymentType(ApplicationRoute.Images, t),
            })}
            image={image}
            onCreate={onCreateContainer}
            names={containerNames}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.saveNewVersion &&
        createPortal(
          <ImageNewVersion
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
          <ImageNewVersion
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
          <ImageInstall
            image={image}
            title={t(ImagesI18nKey.InstallModalTitle, { type: getTranslatedType(getRouteByType(image.$type), t) })}
            isModalOpen={isModalOpen}
            onClose={onCloseModal}
            onApply={onInstallImage}
          />,
          document.body,
        )}
    </>
  );
};

export default ImagesButtonsWrapper;
