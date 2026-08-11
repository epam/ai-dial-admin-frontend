'use client';

import { FC } from 'react';

import { ConfirmationPopupVariant, DialConfirmationPopup } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, ExternalServiceI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';

interface Props {
  applicationName: string;
  isApproved: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const ExternalServiceConsentDialog: FC<Props> = ({ applicationName, isApproved, isLoading, onConfirm, onClose }) => {
  const t = useI18n();

  const header = isApproved
    ? t(ExternalServiceI18nKey.WithdrawConsentTitle, { application: applicationName })
    : t(ExternalServiceI18nKey.GrantConsentTitle, { application: applicationName });

  const description = isApproved
    ? t(ExternalServiceI18nKey.WithdrawConsentDescription, { application: applicationName })
    : t(ExternalServiceI18nKey.GrantConsentDescription);

  const confirmLabel = isApproved ? t(ExternalServiceI18nKey.WithdrawConsent) : t(ExternalServiceI18nKey.GrantConsent);

  return (
    <DialConfirmationPopup
      open={true}
      variant={ConfirmationPopupVariant.Danger}
      header={header}
      description={description}
      confirmLabel={confirmLabel}
      cancelLabel={t(ButtonsI18nKey.Cancel)}
      isLoading={isLoading}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
};

export default ExternalServiceConsentDialog;
