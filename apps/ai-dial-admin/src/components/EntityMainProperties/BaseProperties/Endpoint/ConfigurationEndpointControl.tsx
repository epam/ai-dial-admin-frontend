import { FC } from 'react';

import { EntityPlaceholdersI18nKey, FeaturesI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import EndpointControl, { EndpointControlProps } from './Endpoint';

const ConfigurationEndpointControl: FC<EndpointControlProps> = ({ ...props }) => {
  const t = useI18n();

  return (
    <EndpointControl
      id="configurationEndpoint"
      fieldTitle={t(FeaturesI18nKey.configurationEndpoint)}
      placeholder={t(EntityPlaceholdersI18nKey.ConfigurationEndpoint)}
      {...props}
    />
  );
};

export default ConfigurationEndpointControl;
