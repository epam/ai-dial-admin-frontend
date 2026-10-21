'use client';

import { FC, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { IconPlus } from '@tabler/icons-react';
import Cloud from '@/public/images/icons/cloud.svg';
import { DialButtonDropdown, GhostButton, PrimaryButton, DropdownItem } from '@epam/ai-dial-ui-kit';

import { ApplicationRoute } from '@/src/types/routes';
import { Image } from '@/src/models/deployments/images';
import { ButtonsI18nKey, ImagesI18nKey } from '@/src/constants/i18n';
import { ModalType } from '@/src/components/EntityListView/Components/Modals';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useNotification } from '@/src/context/NotificationContext';
import { createImage, getGlobalWhitelist, updateGlobalWhitelist } from '@/src/app/actions/deployments';
import { getErrorNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { useAppContext } from '@/src/context/AppContext';

import GlobalWhitelist from '@/src/components/Deployments/Modals/GlobalWhitelist';
import ImageAdd from '@/src/components/Deployments/Modals/ImageAdd';

interface Props {
  route: ApplicationRoute;
  isReadOnlyAdmin?: boolean;
}

const HeaderButtons: FC<Props> = ({ route, isReadOnlyAdmin }) => {
  const t = useI18n();
  const isTabletScreen = useIsTabletScreen();
  const { showNotification } = useNotification();
  const router = useRouter();
  const { featureFlags } = useAppContext();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>();

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setModalType(void 0);
  }, []);

  const handleModalOpen = useCallback((modalType: ModalType) => {
    setModalType(modalType);
    setIsModalOpen(true);
  }, []);

  const onCreateImage = useCallback(
    (image: Image) => {
      createImage(image).then((res) => {
        if (res.success) {
          router.push(getUrnForEntity(route, res.response));
        } else {
          showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
        }
      });
    },
    [route, router, showNotification],
  );

  const dropdownItems: DropdownItem[] = useMemo(
    () => [
      {
        key: 'add-image',
        label: t(ImagesI18nKey.AddImage),
        onClick: () => handleModalOpen(ModalType.addImage),
      },
      {
        key: 'mcp-registry',
        label: t(ImagesI18nKey.FromMcpRegistry),
        onClick: () => handleModalOpen(ModalType.addImageFromMcpRegistry),
      },
    ],
    [t, handleModalOpen],
  );

  return (
    <>
      <div className="flex gap-4">
        <GhostButton
          label={t(ButtonsI18nKey.GlobalFirewall)}
          iconBefore={<Cloud {...BASE_BUTTON_ICON_PROPS} />}
          onClick={() => handleModalOpen(ModalType.globalFirewall)}
        />

        {!isReadOnlyAdmin &&
          (featureFlags.mcpRegistryEnabled ? (
            <DialButtonDropdown items={dropdownItems} label={isTabletScreen ? '' : t(ButtonsI18nKey.Add)} />
          ) : (
            <PrimaryButton
              label={isTabletScreen ? '' : t(ButtonsI18nKey.Add)}
              iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
              onClick={() => handleModalOpen(ModalType.addImage)}
            />
          ))}
      </div>

      {isModalOpen &&
        modalType === ModalType.globalFirewall &&
        createPortal(
          <GlobalWhitelist
            isModalOpen={isModalOpen}
            onClose={handleModalClose}
            onApply={(domains) => updateGlobalWhitelist(domains)}
            getDomains={getGlobalWhitelist}
            disabled={isReadOnlyAdmin}
          />,
          document.body,
        )}

      {isModalOpen &&
        modalType === ModalType.addImage &&
        createPortal(
          <ImageAdd
            isModalOpen={isModalOpen}
            modalTitle={t(ImagesI18nKey.AddModalTitle)}
            onClose={handleModalClose}
            onApply={onCreateImage}
          />,
          document.body,
        )}

      {isModalOpen &&
        modalType === ModalType.addImageFromMcpRegistry &&
        createPortal(
          <ImageAdd
            isModalOpen={isModalOpen}
            modalTitle={t(ImagesI18nKey.AddFromMcpRegistryModalTitle)}
            onClose={handleModalClose}
            onApply={onCreateImage}
            isRegistry
          />,
          document.body,
        )}
    </>
  );
};

export default HeaderButtons;
