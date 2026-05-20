import { FC, useEffect, useState } from 'react';
import {
  DialConfirmationPopup,
  DialGhostButton,
  DialNeutralButton,
  DialPrimaryButton,
  PopupSize,
} from '@epam/ai-dial-ui-kit';
import { IconExternalLink } from '@tabler/icons-react';

import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { ButtonsI18nKey, DeploymentsI18nKey } from '@/src/constants/i18n';
import { ServerActionResponse } from '@/src/models/server-action';
import { ApplicationRoute } from '@/src/types/routes';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { AuditListPreselect } from '@/src/types/audit-list-preselect';
import { saveAuditListPreselect } from '@/src/utils/audit-list-preselect';
import { getWhitelistDomainError } from '@/src/utils/deployments/validation';
import { useI18n } from '@/src/locales/client';

import ItemsList from '@/src/components/Deployments/Common/ItemsList/ItemsList';

interface Props {
  onClose: () => void;
  isModalOpen: boolean;
  onApply: (domains: string[]) => void;
  getDomains: () => Promise<ServerActionResponse>;
  disabled?: boolean;
}

const GlobalWhitelist: FC<Props> = ({ onClose, isModalOpen, onApply, getDomains, disabled }) => {
  const t = useI18n();
  const { isValid } = useSaveValidationContext();

  const [domains, setDomains] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    getDomains().then(({ response, success }) => {
      if (success) {
        setDomains(response as string[]);
        setIsLoading(false);
      }
    });
  }, [getDomains]);

  const handleSubmit = () => {
    onApply(domains);
    onClose();
  };

  const onViewInActivityAudit = () => {
    saveAuditListPreselect(AuditListPreselect.GlobalFirewall);
    // Do not add 'noopener' here — the audit list reads the preselect from sessionStorage,
    // which is inherited by the new tab only when the opener relationship is intact.
    window.open(ApplicationRoute.ActivityAudit, '_blank');
  };

  const confirmLabel = disabled ? t(ButtonsI18nKey.Close) : t(ButtonsI18nKey.Apply);
  const onConfirm = disabled ? onClose : handleSubmit;
  const isConfirmDisabled = disabled ? false : !isValid || domains.some((domain) => !!getWhitelistDomainError(domain));

  const footer = (
    <div className="flex flex-row items-center justify-between px-6 py-4">
      <DialGhostButton
        label={t(DeploymentsI18nKey.ViewInActivityAudit)}
        iconAfter={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} />}
        onClick={onViewInActivityAudit}
      />
      {!isLoading && (
        <div className="flex flex-row items-center gap-2">
          <DialNeutralButton label={t(ButtonsI18nKey.Cancel)} onClick={onClose} />
          <DialPrimaryButton label={confirmLabel} disabled={isConfirmDisabled} onClick={onConfirm} />
        </div>
      )}
    </div>
  );

  return (
    <DialConfirmationPopup
      portalId="GlobalWhitelistModal"
      onClose={onClose}
      onConfirm={onConfirm}
      open={isModalOpen}
      header={t(DeploymentsI18nKey.GlobalFirewall)}
      isLoading={isLoading}
      size={PopupSize.Md}
      footer={footer}
    >
      <div className="flex flex-col py-4 px-6 gap-4">
        <p>{t(DeploymentsI18nKey.GlobalWhitelist)}</p>
        <div className="h-[400px]">
          <ItemsList
            items={domains}
            setItems={setDomains}
            addItemLabel={t(DeploymentsI18nKey.AddDomain)}
            validate={(value) => getWhitelistDomainError(value, t)}
            isModal={true}
            disabled={disabled}
          />
        </div>
      </div>
    </DialConfirmationPopup>
  );
};

export default GlobalWhitelist;
