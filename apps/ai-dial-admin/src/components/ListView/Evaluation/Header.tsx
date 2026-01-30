'use client';

import { MouseEvent, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import { DialGhostButton, DialPrimaryButton } from '@epam/ai-dial-ui-kit';
import { IconColumns2, IconPlus } from '@tabler/icons-react';
import { GridApi } from 'ag-grid-community';

import { ModalType } from '@/src/components/EntityListView/Components/Modals';
import ResetFiltersButton from '@/src/components/ListView/Header/ResetFiltersButton';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { TestSuits } from '@/src/models/evaluation/test-suit';
import CreateTestSuit from '@/src/components/TestSuits/Modals/Create/CreateTestSuit';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';

interface Props<T> {
  route: ApplicationRoute;
  gridApi?: GridApi | null;
  names: string[];
  toggleColumnsPanel: () => void;
  onCreateEntity?: (entity: T) => Promise<ServerActionResponse>;
}

const HeaderButtons = <T extends object>({ route, names, gridApi, toggleColumnsPanel, onCreateEntity }: Props<T>) => {
  const t = useI18n();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>();
  const isTabletScreen = useIsTabletScreen();
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setModalType(void 0);
  }, []);

  const handleModalOpen = useCallback((modalType: ModalType) => {
    setModalType(modalType);
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
          handleModalClose();
        }
      });
    },
    [handleModalClose, onCreateEntity],
  );

  const getCreateModal = () => {
    return (
      <SaveValidationContextProvider>
        {route === ApplicationRoute.TestSuits && (
          <CreateTestSuit
            isModalOpen={isModalOpen}
            onClose={handleModalClose}
            names={names || []}
            onCreate={onCreate as (suit: TestSuits) => void}
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
        onClick={() => handleModalOpen(ModalType.create)}
      />

      {isModalOpen && modalType === ModalType.create && createPortal(getCreateModal(), document.body)}
    </div>
  );
};

export default HeaderButtons;
