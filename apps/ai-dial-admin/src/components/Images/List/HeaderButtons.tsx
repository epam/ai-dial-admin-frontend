'use client';

import { FC, MouseEvent, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { IconColumns2, IconPlus } from '@tabler/icons-react';
import Cloud from '@/public/images/icons/cloud.svg';
import { GridApi } from 'ag-grid-community';
import { DialGhostButton, DialPrimaryButton } from '@epam/ai-dial-ui-kit';

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

import ResetFiltersButton from '@/src/components/ListView/Header/ResetFiltersButton';
import GlobalWhitelist from '@/src/components/Deployments/Modals/GlobalWhitelist';
import ImageAdd from '@/src/components/Deployments/Modals/ImageAdd';

interface Props {
  toggleColumnsPanel: () => void;
  route: ApplicationRoute;
  gridApi?: GridApi | null;
}

const HeaderButtons: FC<Props> = ({ toggleColumnsPanel, route, gridApi }) => {
  const t = useI18n();
  const isTabletScreen = useIsTabletScreen();
  const { showNotification } = useNotification();
  const router = useRouter();

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
        <DialGhostButton
          label={t(ButtonsI18nKey.GlobalFirewall)}
          iconBefore={<Cloud {...BASE_BUTTON_ICON_PROPS} />}
          onClick={() => handleModalOpen(ModalType.globalFirewall)}
        />
        <ResetFiltersButton gridApi={gridApi} />
        <DialGhostButton
          label={t(ButtonsI18nKey.Columns)}
          iconBefore={<IconColumns2 {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onToggleColumnsPanel}
        />

        <DialPrimaryButton
          label={isTabletScreen ? '' : t(ButtonsI18nKey.Add)}
          iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
          onClick={() => handleModalOpen(ModalType.addImage)}
        />
      </div>

      {isModalOpen &&
        modalType === ModalType.globalFirewall &&
        createPortal(
          <GlobalWhitelist
            isModalOpen={isModalOpen}
            onClose={handleModalClose}
            onApply={(domains) => updateGlobalWhitelist(domains)}
            getDomains={getGlobalWhitelist}
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
    </>
  );
};

export default HeaderButtons;
