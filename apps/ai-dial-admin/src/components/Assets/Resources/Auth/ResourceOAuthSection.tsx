import { FC, useMemo } from 'react';

import { DialNotification, DialSelectField, NotificationVariant, SelectOption } from '@epam/ai-dial-ui-kit';

import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import ClientIdControl from '@/src/components/Toolsets/Auth/Controls/ClientIdControl';
import ClientSecretControl from '@/src/components/Toolsets/Auth/Controls/ClientSecretControl';
import { BasicI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import {
  DialToolsetResourceAuthSettings,
  TokenEndpointAuthMethod,
  ToolsetAuthStatus,
  ToolsetCodeChallengeMethod,
} from '@/src/models/dial/resource';

enum AuthType {
  DYNAMIC = 'dynamic',
  EXISTING = 'existing',
}

interface Props {
  authSettings?: DialToolsetResourceAuthSettings;
  disabled?: boolean;
  onChange?: (entity: DialToolsetResourceAuthSettings) => void;
}

const ResourceOAuthSection: FC<Props> = ({ disabled, authSettings, onChange }) => {
  const t = useI18n();

  const types: SelectOption[] = [{ value: AuthType.EXISTING, label: t(ToolsetI18nKey.ExistingClient) }];

  const methods: SelectOption[] = [
    { value: BasicI18nKey.None, label: t(BasicI18nKey.None) },
    { value: ToolsetCodeChallengeMethod.PLAIN, label: ToolsetCodeChallengeMethod.PLAIN },
    { value: ToolsetCodeChallengeMethod.S256, label: ToolsetCodeChallengeMethod.S256 },
  ];

  const tokenEndpointAuthMethods: SelectOption[] = [
    {
      value: TokenEndpointAuthMethod.CLIENT_SECRET_BASIC,
      label: t(ToolsetI18nKey.TokenEndpointAuthMethodClientSecretBasic),
    },
    {
      value: TokenEndpointAuthMethod.CLIENT_SECRET_POST,
      label: t(ToolsetI18nKey.TokenEndpointAuthMethodClientSecretPost),
    },
    { value: TokenEndpointAuthMethod.CLIENT_SECRET_NONE, label: t(ToolsetI18nKey.TokenEndpointAuthMethodNone) },
  ];

  const isLoggedIn = useMemo(() => {
    return (
      authSettings?.global_auth_status === ToolsetAuthStatus.SIGNED_IN ||
      authSettings?.user_level_auth_status === ToolsetAuthStatus.SIGNED_IN
    );
  }, [authSettings]);

  const isAuthDisabled = disabled || isLoggedIn;

  return (
    <div className="flex flex-col pl-[26px]">
      {isLoggedIn && (
        <div className="mb-3">
          <DialNotification variant={NotificationVariant.Info} message={t(ToolsetI18nKey.AuthSettingsLockedMessage)} />
        </div>
      )}
      <div className="flex flex-col gap-y-3">
        <DialSelectField
          id="type"
          disabled={isAuthDisabled}
          label={t(ToolsetI18nKey.ClientRegistrationType)}
          value={AuthType.EXISTING}
          options={types}
          onChange={(type) => {
            onChange?.({
              ...(authSettings || {}),
              client_id: type === AuthType.EXISTING ? '' : undefined,
            } as DialToolsetResourceAuthSettings);
          }}
        />

        <DialSelectField
          id="tokenEndpointAuthMethod"
          disabled={isAuthDisabled}
          label={t(ToolsetI18nKey.TokenEndpointAuthMethod)}
          value={authSettings?.token_endpoint_auth_method ?? TokenEndpointAuthMethod.CLIENT_SECRET_BASIC}
          options={tokenEndpointAuthMethods}
          onChange={(tokenEndpointAuthMethod) => {
            onChange?.({
              ...(authSettings || {}),
              token_endpoint_auth_method: tokenEndpointAuthMethod as TokenEndpointAuthMethod,
            });
          }}
        />
      </div>

      <div className="flex flex-col gap-y-3 mt-3 w-full">
        <ClientIdControl
          clientId={authSettings?.client_id}
          disabled={isAuthDisabled}
          isLoggedIn={isLoggedIn}
          onChange={(client_id) => onChange?.({ ...(authSettings || {}), client_id })}
        />
        <ClientSecretControl
          clientSecret={authSettings?.client_secret}
          disabled={isAuthDisabled}
          isLoggedIn={isLoggedIn}
          onChange={(client_secret) => onChange?.({ ...(authSettings || {}), client_secret })}
        />
        <Multiselect
          elementId="scopes"
          disabled={isAuthDisabled}
          selectedItems={authSettings?.scopes_supported}
          allItems={authSettings?.scopes_supported}
          onChangeItems={(scopes_supported: string[]) => {
            onChange?.({ ...(authSettings || {}), scopes_supported });
          }}
          heading={t(EntityFieldsI18nKey.scopes)}
          label={t(EntityFieldsI18nKey.scopes)}
          addTitle={t(BasicI18nKey.AddField)}
        />

        <EndpointControl
          disabled={isAuthDisabled}
          required
          isFullWidth
          id="authEndpoint"
          label={t(EntityFieldsI18nKey.authorizationEndpoint)}
          endpoint={authSettings?.authorization_endpoint || ''}
          placeholder={t(EntityPlaceholdersI18nKey.AuthorizationEndpoint)}
          onChange={(authorization_endpoint) => onChange?.({ ...(authSettings || {}), authorization_endpoint })}
        />

        <EndpointControl
          id="tokenEndpoint"
          disabled={isAuthDisabled}
          required
          isFullWidth
          label={t(EntityFieldsI18nKey.tokenEndpoint)}
          endpoint={authSettings?.token_endpoint || ''}
          placeholder={t(EntityPlaceholdersI18nKey.TokenEndpoint)}
          onChange={(token_endpoint) => onChange?.({ ...(authSettings || {}), token_endpoint })}
        />

        <DialSelectField
          containerClassName="w-[192px]"
          id="type"
          disabled={isAuthDisabled}
          label={t(EntityFieldsI18nKey.codeChallengeMethod)}
          value={!authSettings?.code_challenge_method ? BasicI18nKey.None : authSettings.code_challenge_method}
          options={methods}
          onChange={(code_challenge_method) => {
            onChange?.({
              ...(authSettings || {}),
              code_challenge_method: (code_challenge_method === BasicI18nKey.None
                ? ''
                : code_challenge_method) as ToolsetCodeChallengeMethod,
              code_challenge: authSettings?.code_challenge,
              code_verifier: authSettings?.code_verifier,
            });
          }}
        />
      </div>
    </div>
  );
};

export default ResourceOAuthSection;
