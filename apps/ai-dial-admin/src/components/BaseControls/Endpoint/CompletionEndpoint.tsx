import { FC } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import EndpointControl, { EndpointControlProps } from './Endpoint';

const CompletionEndpointControl: FC<EndpointControlProps> = ({ ...props }) => {
  const t = useI18n();

  return (
    <EndpointControl
      id="completionEndpoint"
      label={t(EntityFieldsI18nKey.completionEndpoint)}
      placeholder={t(EntityPlaceholdersI18nKey.CompletionEndpoint)}
      {...props}
    />
  );
};

export default CompletionEndpointControl;
