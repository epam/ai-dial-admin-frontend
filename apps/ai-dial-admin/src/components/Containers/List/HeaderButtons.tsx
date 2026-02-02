'use client';

import { FC, MouseEvent, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconColumns2, IconPlus } from '@tabler/icons-react';
import { GridApi } from 'ag-grid-community';
import { DialGhostButton, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { ApplicationRoute } from '@/src/types/routes';
import { useI18n } from '@/src/locales/client';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useNotification } from '@/src/context/NotificationContext';
import { Container } from '@/src/models/deployments/containers';
import { createContainer } from '@/src/app/actions/deployments';
import { getErrorNotification } from '@/src/utils/notification';
import ResetFiltersButton from '@/src/components/ListView/Header/ResetFiltersButton';
import { ButtonsI18nKey, ContainersI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import CreateContainer from '@/src/components/Containers/Modals/CreateContainer';
import { getTranslatedDeploymentType, getTranslatedType } from '@/src/utils/deployments/entity';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import { useRouter } from 'next/navigation';
import CreateServing from '@/src/components/Containers/Modals/CreateServing';

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

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleModalOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

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
        <DialPrimaryButton
          label={isTabletScreen ? '' : t(ButtonsI18nKey.Create)}
          iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
          onClick={() => handleModalOpen()}
        />
      </div>

      {isModalOpen &&
        createPortal(
          route === ApplicationRoute.ModelServings ? (
            <CreateServing
              isModalOpen={isModalOpen}
              onClose={handleModalClose}
              onApply={onCreateContainer}
              route={route}
              names={names}
            />
          ) : (
            <CreateContainer
              isModalOpen={isModalOpen}
              modalTitle={t(ContainersI18nKey.CreateModalTitle, {
                type: getTranslatedType(route, t),
                entityType: getTranslatedDeploymentType(route, t),
              })}
              onClose={handleModalClose}
              onApply={onCreateContainer}
              route={route}
              names={names}
            />
          ),
          document.body,
        )}
    </>
  );
};

export default HeaderButtons;
