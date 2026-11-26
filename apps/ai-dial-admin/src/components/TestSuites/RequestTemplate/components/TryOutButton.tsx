'use client';

import { FC, useEffect, useMemo } from 'react';

import { OutlinedButton } from '@epam/ai-dial-ui-kit';

import Tryout from '@/public/images/icons/tryout.svg';
import { useOpenTryOutSidebar } from '@/src/components/TryOut/hooks/use-try-out-sidebar';
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
  const { sidebar } = useAppContext();

  const content = useMemo(
    () => (
      <SaveValidationContextProvider>
        <TryOut testSuite={testSuite} />
      </SaveValidationContextProvider>
    ),
    [testSuite],
  );
  const onOpenTryOutSidebar = useOpenTryOutSidebar(content);

  useEffect(() => {
    return () => sidebar.closeSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <OutlinedButton label={t(ButtonsI18nKey.TryOut)} iconBefore={<Tryout />} onClick={onOpenTryOutSidebar} />;
};

export default TryOutButton;
