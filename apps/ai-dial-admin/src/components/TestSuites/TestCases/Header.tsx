'use client';

import { FC, MouseEvent, useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  ButtonAppearance,
  ButtonVariant,
  DialButtonDropdown,
  DialGhostButton,
  DialPrimaryButton,
  DropdownItem,
} from '@epam/ai-dial-ui-kit';
import { IconColumns2, IconPlus } from '@tabler/icons-react';
import { GridApi } from 'ag-grid-community';
import { useRouter } from 'next/navigation';

import ResetFiltersButton from '@/src/components/ListView/Header/ResetFiltersButton';
import CreateTestSuite from '@/src/components/TestSuites/Modals/Create/CreateTestSuite';
import { ButtonsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useNotification } from '@/src/context/NotificationContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { getCreateNotificationDescription, getCreateNotificationTitle } from '@/src/utils/entities/create-entity';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
import { getUrnForEntity } from '@/src/utils/open-in-new-tab';
import AddTestCase from './AddTestCase';
import ImportFileModal from './Import/ImportFile';

interface Props {}

const HeaderButtons: FC<Props> = ({}) => {
  const t = useI18n();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const items: DropdownItem[] = useMemo(() => {
    return [
      { key: 'storage', label: t(TestSuitesI18nKey.FromPC), onClick: () => setIsImportModalOpen(true) },
      // {
      //   key: 'dial-storage',
      //   label: t(TestSuitesI18nKey.FromDial),
      // },
    ];
  }, [t]);

  return (
    <div className="flex gap-4">
      <DialButtonDropdown
        label={t(ButtonsI18nKey.Import)}
        items={items}
        variant={ButtonVariant.Primary}
        appearance={ButtonAppearance.Ghost}
      />

      <DialPrimaryButton
        label={t(ButtonsI18nKey.Add)}
        iconBefore={<IconPlus {...BASE_BUTTON_ICON_PROPS} />}
        onClick={() => setIsAddModalOpen(true)}
      />

      {isAddModalOpen &&
        createPortal(
          <AddTestCase isModalOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={() => {}} />,
          document.body,
        )}
      {isImportModalOpen &&
        createPortal(
          <ImportFileModal
            isModalOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onApply={() => {}}
          />,
          document.body,
        )}
    </div>
  );
};

export default HeaderButtons;
