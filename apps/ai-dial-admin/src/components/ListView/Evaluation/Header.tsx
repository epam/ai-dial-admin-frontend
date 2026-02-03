'use client';

import { MouseEvent, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialGhostButton, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconColumns2, IconPlus } from '@tabler/icons-react';
import { GridApi } from 'ag-grid-community';

import ResetFiltersButton from '@/src/components/ListView/Header/ResetFiltersButton';
import CreateTestSuite from '@/src/components/TestSuites/Modals/Create/CreateTestSuite';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';

interface Props<T> {
  route: ApplicationRoute;
  gridApi?: GridApi | null;
  toggleColumnsPanel: () => void;
  onCreateEntity?: (entity: T) => Promise<ServerActionResponse>;
}

const HeaderButtons = <T extends object>({ route, gridApi, toggleColumnsPanel, onCreateEntity }: Props<T>) => {
  const t = useI18n();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const isTabletScreen = useIsTabletScreen();

  const onModalClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const onModalOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const onToggleColumnsPanel = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      toggleColumnsPanel();
    },
    [toggleColumnsPanel],
  );

  const onCreate = useCallback(
    (entity: T) => {
      onCreateEntity?.(entity).then((res) => {
        if (res.success) {
          // TODO: add notification about successful creation
          onModalClose();
        }
      });
    },
    [onModalClose, onCreateEntity],
  );

  const getCreateModal = () => {
    return (
      <SaveValidationContextProvider>
        {route === ApplicationRoute.TestSuites && (
          <CreateTestSuite
            isModalOpen={isModalOpen}
            onClose={onModalClose}
            onCreate={onCreate as (suite: TestSuite) => void}
          />
        )}
      </SaveValidationContextProvider>
    );
  };

  return (
    <div className="flex gap-4">
      <ResetFiltersButton gridApi={gridApi} />
      {gridApi?.getRenderedNodes().length && (
        <DialGhostButton
          label={t(ButtonsI18nKey.Columns)}
          iconBefore={<IconColumns2 {...BASE_BUTTON_ICON_PROPS} />}
          onClick={onToggleColumnsPanel}
        />
      )}

      <DialPrimaryButton
        label={isTabletScreen ? '' : t(ButtonsI18nKey.Create)}
        iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
        onClick={onModalOpen}
      />

      {isModalOpen && createPortal(getCreateModal(), document.body)}
    </div>
  );
};

export default HeaderButtons;
