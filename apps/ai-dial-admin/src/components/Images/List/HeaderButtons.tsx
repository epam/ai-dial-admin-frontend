'use client';

import { MouseEvent, FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconPlus, IconColumns2 } from '@tabler/icons-react';
import { GridApi } from 'ag-grid-community';
import { ButtonVariant, DialButton } from '@epam/ai-dial-ui-kit';
import { ApplicationRoute } from '@/src/types/routes';
import { useI18n } from '@/src/locales/client';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useNotification } from '@/src/context/NotificationContext';
import { Image } from '@/src/models/deployments/images';
import { createImage } from '@/src/app/actions/deployments';
import { getErrorNotification } from '@/src/utils/notification';
import ResetFiltersButton from '@/src/components/EntityListView/HeaderButtons/ResetFiltersButton';
import { ButtonsI18nKey, ImagesI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import AddImageModal from '@/src/components/Images/Modals/AddImage';
import { getTranslatedType } from '@/src/utils/deployments/entity';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { DEPLOYMENT_ENTITY } from '@/src/models/deployments';
import { useRouter } from 'next/navigation';

interface Props {
  toggleColumnsPanel: () => void;
  route: ApplicationRoute;
  gridApi?: GridApi | null;
}

const HeaderButtons: FC<Props> = ({ toggleColumnsPanel, route, gridApi }) => {
  const t = useI18n() as (key: string, options?: Record<string, string | number>) => string;
  const isTabletScreen = useIsTabletScreen();
  const { showNotification } = useNotification();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleModalOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const onCreateImage = useCallback(
    (image: Image) => {
      createImage(image).then((res) => {
        if (res.success) {
          router.push(getUrnForEntity(route, res.response, DEPLOYMENT_ENTITY.containers));
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
        <DialButton
          variant={ButtonVariant.Tertiary}
          label={t(ButtonsI18nKey.Columns)}
          iconBefore={<IconColumns2 {...BASE_ICON_PROPS} />}
          onClick={onToggleColumnsPanel}
        />

        <DialButton
          variant={ButtonVariant.Primary}
          label={isTabletScreen ? '' : t(ButtonsI18nKey.Add)}
          iconBefore={<IconPlus {...BASE_ICON_PROPS} />}
          onClick={() => handleModalOpen()}
        />
      </div>

      {isModalOpen &&
        createPortal(
          <AddImageModal
            isModalOpen={isModalOpen}
            modalTitle={t(ImagesI18nKey.AddModalTitle, { type: getTranslatedType(route, t) })}
            onClose={handleModalClose}
            onApply={onCreateImage}
            route={route}
          />,
          document.body,
        )}
    </>
  );
};

export default HeaderButtons;
