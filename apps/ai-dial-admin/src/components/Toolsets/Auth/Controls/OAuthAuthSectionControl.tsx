import { FC } from 'react';

import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import ClientIdControl from './ClientIdControl';
import ClientSecretControl from './ClientSecretControl';

interface Props {
  clientId?: string;
  clientSecret?: string;
  authorizationEndpoint?: string;
  tokenEndpoint?: string;
  onChangeClientId: (clientId: string) => void;
  onChangeClientSecret: (clientSecret: string) => void;
  onChangeAuthorizationEndpoint: (authorizationEndpoint?: string) => void;
  onChangeTokenEndpoint?: (tokenEndpoint?: string) => void;
}

const OAuthAuthSectionControl: FC<Props> = ({
  clientId,
  clientSecret,
  authorizationEndpoint,
  tokenEndpoint,
  onChangeClientId,
  onChangeClientSecret,
  onChangeAuthorizationEndpoint,
  onChangeTokenEndpoint,
}) => {
  const t = useI18n();

  return (
    <>
      <ClientIdControl clientId={clientId} onChange={onChangeClientId} />
      <ClientSecretControl clientSecret={clientSecret} onChange={onChangeClientSecret} />
      <EndpointControl
        required
        id="authEndpoint"
        isFullWidth
        label={t(EntityFieldsI18nKey.authorizationEndpoint)}
        endpoint={authorizationEndpoint || ''}
        placeholder={t(EntityPlaceholdersI18nKey.AuthorizationEndpoint)}
        onChange={onChangeAuthorizationEndpoint}
        isFullWidth
      />

      <EndpointControl
        id="tokenEndpoint"
        required
        isFullWidth
        label={t(EntityFieldsI18nKey.tokenEndpoint)}
        isFullWidth
        endpoint={tokenEndpoint || ''}
        placeholder={t(EntityPlaceholdersI18nKey.TokenEndpoint)}
        onChange={onChangeTokenEndpoint}
      />
    </>
  );
};

export default OAuthAuthSectionControl;
