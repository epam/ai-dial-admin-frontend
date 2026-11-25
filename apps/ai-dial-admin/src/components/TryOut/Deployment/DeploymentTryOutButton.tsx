'use client';

import { FC, useEffect, useMemo } from 'react';

import { OutlinedButton } from '@epam/ai-dial-ui-kit';

import Tryout from '@/public/images/icons/tryout.svg';
import DeploymentTryOut from '@/src/components/TryOut/Deployment/DeploymentTryOut';
import { useOpenTryOutSidebar } from '@/src/components/TryOut/hooks/use-try-out-sidebar';
import { ButtonsI18nKey } from '@/src/constants/i18n';
import { useAppContext } from '@/src/context/AppContext';
import { SaveValidationContextProvider } from '@/src/context/SaveValidationContext';
import { useI18n } from '@/src/locales/client';

interface Props {
  /** The deployment's id as Core names it. */
  deployment: string;
}

const DeploymentTryOutButton: FC<Props> = ({ deployment }) => {
  const t = useI18n();
  const { sidebar } = useAppContext();

  const content = useMemo(
    () => (
      <SaveValidationContextProvider>
        <DeploymentTryOut key={deployment} deployment={deployment} />
      </SaveValidationContextProvider>
    ),
    [deployment],
  );
  const onOpenTryOutSidebar = useOpenTryOutSidebar(content);

  useEffect(() => {
    return () => sidebar.closeSidebar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <OutlinedButton label={t(ButtonsI18nKey.TryOut)} iconBefore={<Tryout />} onClick={onOpenTryOutSidebar} />;
};

export default DeploymentTryOutButton;
