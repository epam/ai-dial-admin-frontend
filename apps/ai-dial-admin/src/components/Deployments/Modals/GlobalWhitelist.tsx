import { FC, useEffect, useState } from 'react';
import { DialFormPopup } from '@epam/ai-dial-ui-kit';

import { ButtonsI18nKey, DeploymentsI18nKey } from '@/src/constants/i18n';
import { ServerActionResponse } from '@/src/models/server-action';
import { useSaveValidationContext } from '@/src/context/SaveValidationContext';
import { getWhitelistDomainError } from '@/src/utils/deployments/validation';
import { useI18n } from '@/src/locales/client';

import ItemsList from '@/src/components/Deployments/Common/ItemsList/ItemsList';

interface Props {
  onClose: () => void;
  isModalOpen: boolean;
  onApply: (domains: string[]) => void;
  getDomains: () => Promise<ServerActionResponse>;
}

const GlobalWhitelist: FC<Props> = ({ onClose, isModalOpen, onApply, getDomains }) => {
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

  return (
    <DialFormPopup
      onClose={onClose}
      open={isModalOpen}
      header={t(DeploymentsI18nKey.GlobalFirewall)}
      submitLabel={t(ButtonsI18nKey.Apply)}
      onSubmit={handleSubmit}
      disableSubmitButton={!isValid || domains.some((domain) => !!getWhitelistDomainError(domain))}
      isLoading={isLoading}
    >
      <div className="flex flex-col py-4 px-6 gap-4">
        <p>{t(DeploymentsI18nKey.GlobalWhitelist)}</p>
        <div className="h-[400px]">
          <ItemsList
            items={domains}
            setItems={setDomains}
            addItemLabel={t(DeploymentsI18nKey.AddDomain)}
            validate={(value) => getWhitelistDomainError(value, t)}
          />
        </div>
      </div>
    </DialFormPopup>
  );
};

export default GlobalWhitelist;
