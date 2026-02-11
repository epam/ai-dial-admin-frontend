'use client';

import { FC, MouseEvent, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { DialButtonDropdown, DialGhostButton, DialPrimaryButton, DropdownItem } from '@epam/ai-dial-ui-kit';
import { IconColumns2, IconPlus } from '@tabler/icons-react';
import { GridApi } from 'ag-grid-community';

import { ApplicationRoute } from '@/src/types/routes';
import { Container } from '@/src/models/deployments/containers';
import { ModalType } from '@/src/components/EntityListView/Components/Modals';
import { CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { ButtonsI18nKey, ContainersI18nKey, CreateI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useNotification } from '@/src/context/NotificationContext';
import { createContainer } from '@/src/app/actions/deployments';
import { getErrorNotification } from '@/src/utils/notification';
import { getTranslatedDeploymentType, getTranslatedType } from '@/src/utils/deployments/entity';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { useRouter } from 'next/navigation';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

import ResetFiltersButton from '@/src/components/ListView/Header/ResetFiltersButton';
import ContainerCreate from '@/src/components/Deployments/Modals/ContainerCreate';
import ServingCreate from '@/src/components/Deployments/Modals/ServingCreate';

interface Props {
  toggleColumnsPanel: () => void;
  route: ApplicationRoute;
  names: string[];
  gridApi?: GridApi | null;
}

const HeaderButtons: FC<Props> = ({ toggleColumnsPanel, route, names, gridApi }) => {
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

  const onToggleColumnsPanel = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      toggleColumnsPanel();
    },
    [toggleColumnsPanel],
  );

  return (
    <>
      <div className="flex gap-4">
        <ResetFiltersButton gridApi={gridApi} />
        <DialGhostButton
          label={t(ButtonsI18nKey.Columns)}
          iconBefore={<IconColumns2 {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onToggleColumnsPanel}
        />
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
