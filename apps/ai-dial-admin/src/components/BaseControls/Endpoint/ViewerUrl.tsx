import { FC } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import EndpointControl, { EndpointControlProps } from './Endpoint';

const ViewerUrlControl: FC<EndpointControlProps> = ({ ...props }) => {
  const t = useI18n();

  return (
    <EndpointControl
      id="viewerUrl"
      fieldTitle={t(EntityFieldsI18nKey.viewerUrl)}
      placeholder={t(EntityPlaceholdersI18nKey.ViewerUrl)}
      {...props}
    />
  );
};

export default ViewerUrlControl;
