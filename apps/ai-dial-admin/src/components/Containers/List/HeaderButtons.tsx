'use client';

import { DialButtonDropdown, DialPrimaryButton, DropdownItem } from '@epam/ai-dial-ui-kit';
import { IconPlus } from '@tabler/icons-react';
import { FC, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { createContainer } from '@/src/app/actions/deployments';
import { ModalType } from '@/src/components/EntityListView/Components/Modals';
import { ButtonsI18nKey, ContainersI18nKey, CreateI18nKey, EntitiesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { Container } from '@/src/models/deployments/containers';
import { CONTAINER_SOURCE_TYPE, CONTAINER_TYPE } from '@/src/types/deployments/containers';
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
  isReadOnlyAdmin?: boolean;
}

const HeaderButtons: FC<Props> = ({ route, names, isReadOnlyAdmin }) => {
  const t = useI18n();
  const router = useRouter();
  const isTabletScreen = useIsTabletScreen();
  const { showNotification } = useNotification();
  const { featureFlags } = useAppContext();

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

  const servingsDropdownItems: DropdownItem[] = useMemo(
    () => [
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
    ],
    [t, openHFServingModal, openNIMServingModal],
  );

  const openMcpRegistryModal = useCallback(() => {
    setIsModalOpen(true);
    setModalType(ModalType.createMcpRegistry);
  }, []);

  const mcpDropdownItems: DropdownItem[] = useMemo(
    () => [
      {
        key: 'internal-image',
        label: t(ContainersI18nKey.FromInternalMcpImage),
        onClick: () => handleModalOpen(ModalType.createContainer),
      },
      {
        key: 'docker-image',
        label: t(ContainersI18nKey.FromDockerImageReference),
        onClick: () => handleModalOpen(ModalType.createMcpDockerImage),
      },
      ...(featureFlags.mcpRegistryEnabled
        ? [
            {
              key: 'mcp-registry',
              label: t(ContainersI18nKey.FromMcpRegistry),
              onClick: () => openMcpRegistryModal(),
            },
          ]
        : []),
    ],
    [t, handleModalOpen, openMcpRegistryModal, featureFlags.mcpRegistryEnabled],
  );

  const adapterDropdownItems: DropdownItem[] = useMemo(
    () => [
      {
        key: 'internal-image',
        label: t(ContainersI18nKey.FromInternalAdapterImage),
        onClick: () => handleModalOpen(ModalType.createContainer),
      },
      {
        key: 'docker-image',
        label: t(ContainersI18nKey.FromDockerImageReference),
        onClick: () => handleModalOpen(ModalType.createAdapterDockerImage),
      },
    ],
    [t, handleModalOpen],
  );

  const applicationDropdownItems: DropdownItem[] = useMemo(
    () => [
      {
        key: 'internal-image',
        label: t(ContainersI18nKey.FromInternalApplicationImage),
        onClick: () => handleModalOpen(ModalType.createContainer),
      },
      {
        key: 'docker-image',
        label: t(ContainersI18nKey.FromDockerImageReference),
        onClick: () => handleModalOpen(ModalType.createApplicationDockerImage),
      },
    ],
    [t, handleModalOpen],
  );

  const interceptorDropdownItems: DropdownItem[] = useMemo(
    () => [
      {
        key: 'internal-image',
        label: t(ContainersI18nKey.FromInternalInterceptorImage),
        onClick: () => handleModalOpen(ModalType.createContainer),
      },
      {
        key: 'docker-image',
        label: t(ContainersI18nKey.FromDockerImageReference),
        onClick: () => handleModalOpen(ModalType.createInterceptorDockerImage),
      },
    ],
    [t, handleModalOpen],
  );

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

  const showDropdown =
    route === ApplicationRoute.ModelServings ||
    route === ApplicationRoute.McpContainers ||
    route === ApplicationRoute.AdapterContainers ||
    route === ApplicationRoute.ApplicationContainers ||
    route === ApplicationRoute.InterceptorContainers;

  const getDropdownItems = () => {
    switch (route) {
      case ApplicationRoute.ModelServings:
        return servingsDropdownItems;
      case ApplicationRoute.McpContainers:
        return mcpDropdownItems;
      case ApplicationRoute.AdapterContainers:
        return adapterDropdownItems;
      case ApplicationRoute.ApplicationContainers:
        return applicationDropdownItems;
      case ApplicationRoute.InterceptorContainers:
        return interceptorDropdownItems;
      default:
        return mcpDropdownItems;
    }
  };
  const dropdownItems = getDropdownItems();

  return (
    <>
      <div className="flex gap-4">
        {!isReadOnlyAdmin &&
          (showDropdown ? (
            <DialButtonDropdown items={dropdownItems} label={isTabletScreen ? '' : t(ButtonsI18nKey.Create)} />
          ) : (
            <DialPrimaryButton
              label={isTabletScreen ? '' : t(ButtonsI18nKey.Create)}
              iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
              onClick={() => handleModalOpen(ModalType.createContainer)}
            />
          ))}
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
      {isModalOpen &&
        modalType === ModalType.createMcpDockerImage &&
        createPortal(
          <ServingCreate
            header={t(ContainersI18nKey.CreateModalTitle, {
              type: getTranslatedType(route, t),
              entityType: getTranslatedDeploymentType(route, t),
            })}
            isModalOpen={isModalOpen}
            onClose={handleModalClose}
            onApply={onCreateContainer}
            route={route}
            names={names}
            type={CONTAINER_TYPE.MCP}
            sourceType={CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.createAdapterDockerImage &&
        createPortal(
          <ServingCreate
            header={t(ContainersI18nKey.CreateModalTitle, {
              type: getTranslatedType(route, t),
              entityType: getTranslatedDeploymentType(route, t),
            })}
            isModalOpen={isModalOpen}
            onClose={handleModalClose}
            onApply={onCreateContainer}
            route={route}
            names={names}
            type={CONTAINER_TYPE.ADAPTER}
            sourceType={CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.createApplicationDockerImage &&
        createPortal(
          <ServingCreate
            header={t(ContainersI18nKey.CreateModalTitle, {
              type: getTranslatedType(route, t),
              entityType: getTranslatedDeploymentType(route, t),
            })}
            isModalOpen={isModalOpen}
            onClose={handleModalClose}
            onApply={onCreateContainer}
            route={route}
            names={names}
            type={CONTAINER_TYPE.APPLICATION}
            sourceType={CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.createInterceptorDockerImage &&
        createPortal(
          <ServingCreate
            header={t(ContainersI18nKey.CreateModalTitle, {
              type: getTranslatedType(route, t),
              entityType: getTranslatedDeploymentType(route, t),
            })}
            isModalOpen={isModalOpen}
            onClose={handleModalClose}
            onApply={onCreateContainer}
            route={route}
            names={names}
            type={CONTAINER_TYPE.INTERCEPTOR}
            sourceType={CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE}
          />,
          document.body,
        )}
      {isModalOpen &&
        modalType === ModalType.createMcpRegistry &&
        createPortal(
          <ServingCreate
            header={t(ContainersI18nKey.CreateModalTitle, {
              type: getTranslatedType(route, t),
              entityType: getTranslatedDeploymentType(route, t),
            })}
            isModalOpen={isModalOpen}
            onClose={handleModalClose}
            onApply={onCreateContainer}
            route={route}
            names={names}
            type={CONTAINER_TYPE.MCP}
            sourceType={CONTAINER_SOURCE_TYPE.IMAGE_REFERENCE}
            templateOptions={{ mcpRegistry: true }}
          />,
          document.body,
        )}
    </>
  );
};

export default HeaderButtons;
