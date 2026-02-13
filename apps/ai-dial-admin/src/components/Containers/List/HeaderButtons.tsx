'use client';

import { DialButtonDropdown, DialPrimaryButton, DropdownItem } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import { createContainer } from '@/src/app/actions/deployments';
import { ModalType } from '@/src/components/EntityListView/Components/Modals';
import { ButtonsI18nKey, ContainersI18nKey, CreateI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { Container } from '@/src/models/deployments/containers';
import { CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';
import { getTranslatedDeploymentType, getTranslatedType } from '@/src/utils/deployments/entity';
import { getErrorNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { useRouter } from 'next/navigation';

import ContainerCreate from '@/src/components/Deployments/Modals/ContainerCreate';
import ServingCreate from '@/src/components/Deployments/Modals/ServingCreate';

interface Props {
  route: ApplicationRoute;
  names: string[];
}

const HeaderButtons: FC<Props> = ({ route, names }) => {
  const t = useI18n();
  const router = useRouter();
  const isTabletScreen = useIsTabletScreen();
  const { showNotification } = useNotification();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>();

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setModalType(void 0);
  }, []);

  const handleModalOpen = useCallback((type: ModalType) => {
    setIsModalOpen(true);
    setModalType(type);
  }, []);

  const openHFServingModal = useCallback(() => {
    setIsModalOpen(true);
    setModalType(ModalType.createServingHF);
  }, []);

  const openNIMServingModal = useCallback(() => {
    setIsModalOpen(true);
    setModalType(ModalType.createServingNIM);
  }, []);

  const dropdownItems: DropdownItem[] = [
    {
      key: CONTAINER_TYPE.HF,
      label: t(EntitiesI18nKey.ModelServing, { type: t(ContainersI18nKey.ModelTypeHF) }),
      onClick: () => openHFServingModal(),
    },
    {
      key: CONTAINER_TYPE.NIM,
      label: t(EntitiesI18nKey.ModelServing, { type: t(ContainersI18nKey.ModelTypeNIM) }),
      onClick: () => openNIMServingModal(),
    },
  ];

  const onCreateContainer = useCallback(
    (container: Container) => {
      createContainer(container).then((res) => {
        if (res.success) {
          router.push(getUrnForEntity(route, res.response));
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [route, router, showNotification],
  );

  return (
    <>
      <div className="flex gap-4">
        {route === ApplicationRoute.ModelServings ? (
          <DialButtonDropdown items={dropdownItems} label={isTabletScreen ? '' : t(ButtonsI18nKey.Create)} />
        ) : (
          <DialPrimaryButton
            label={isTabletScreen ? '' : t(ButtonsI18nKey.Create)}
            iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
            onClick={() => handleModalOpen(ModalType.createContainer)}
          />
        )}
      </div>

      {isModalOpen &&
        modalType === ModalType.createContainer &&
        createPortal(
          <ContainerCreate
            isModalOpen={isModalOpen}
            modalTitle={t(ContainersI18nKey.CreateModalTitle, {
              type: getTranslatedType(route, t),
              entityType: getTranslatedDeploymentType(route, t),
            })}
            onClose={handleModalClose}
            onApply={onCreateContainer}
            route={route}
            names={names}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.createServingHF &&
        createPortal(
          <ServingCreate
            header={t(CreateI18nKey.CreateServing, { type: t(ContainersI18nKey.ModelTypeHF) })}
            isModalOpen={isModalOpen}
            onClose={handleModalClose}
            onApply={onCreateContainer}
            route={route}
            names={names}
            type={CONTAINER_TYPE.HF}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.createServingNIM &&
        createPortal(
          <ServingCreate
            header={t(CreateI18nKey.CreateServing, { type: t(ContainersI18nKey.ModelTypeNIM) })}
            isModalOpen={isModalOpen}
            onClose={handleModalClose}
            onApply={onCreateContainer}
            route={route}
            names={names}
            type={CONTAINER_TYPE.NIM}
          />,
          document.body,
        )}
    </>
  );
};

export default HeaderButtons;
