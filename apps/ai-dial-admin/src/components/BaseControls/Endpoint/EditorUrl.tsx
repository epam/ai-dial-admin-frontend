import { FC } from 'react';

import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import EndpointControl, { EndpointControlProps } from './Endpoint';

const EditorUrlControl: FC<EndpointControlProps> = ({ ...props }) => {
  const t = useI18n();

  return (
    <EndpointControl
      id="editorUrl"
      fieldTitle={t(EntityFieldsI18nKey.editorUrl)}
      placeholder={t(EntityPlaceholdersI18nKey.EditorUrl)}
      {...props}
    />
  );
};

export default EditorUrlControl;
