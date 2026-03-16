'use client';

import { FC, MouseEvent, useCallback, useEffect } from 'react';

import { DialNeutralButton } from '@epam/ai-dial-ui-kit';

import Tryout from '@/public/images/icons/tryout.svg';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';
import { TestSuite } from '@/src/models/evaluation/test-suite';
import TryOut from './TryOut';

interface Props {
  testSuite: TestSuite;
}

const TryOutButton: FC<Props> = ({ testSuite }) => {
  const t = useI18n();

  const { sidebar, sidebarOpen, toggleSidebar } = useAppContext();

  const openTryOutSidebar = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      sidebar.showSidebar(
        <SaveValidationContextProvider>
          <TryOut testSuiteId={testSuite.id || ''} />
        </SaveValidationContextProvider>,
        'w-1/2 max-w-[800px] !p-0',
      );
      if (sidebarOpen) {
        sidebar.toggleIsMenuClosed?.();
        toggleSidebar(e);
      }
    },
    [sidebar, sidebarOpen, testSuite.id, toggleSidebar],
  );

  useEffect(() => {
    return () => sidebar.closeSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <DialNeutralButton label={t(ButtonsI18nKey.TryOut)} iconBefore={<Tryout />} onClick={openTryOutSidebar} />;
};

export default TryOutButton;
