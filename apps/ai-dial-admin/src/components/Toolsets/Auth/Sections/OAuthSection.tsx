import { FC, useMemo } from 'react';

import { AlertVariant, DialAlert, DialSelectField, SelectOption } from '@epam/ai-dial-ui-kit';

import EndpointControl from '@/src/components/BaseControls/Endpoint/Endpoint';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import ClientIdControl from '@/src/components/Toolsets/Auth/Controls/ClientIdControl';
import ClientSecretControl from '@/src/components/Toolsets/Auth/Controls/ClientSecretControl';
import { BasicI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ToolsetAuthSettings, ToolsetAuthStatus, ToolsetCodeChallengeMethod } from '@/src/models/dial/toolset';
import { ApplicationRoute } from '@/src/types/routes';

enum AuthType {
  DYNAMIC = 'dynamic',
  EXISTING = 'existing',
}

interface Props {
  authSettings?: ToolsetAuthSettings;
  disabled?: boolean;
  view: ApplicationRoute;
  onChange?: (entity: ToolsetAuthSettings) => void;
}

const OAuthSection: FC<Props> = ({ disabled, authSettings, view, onChange }) => {
  const t = useI18n();

  const types: SelectOption[] = [{ value: AuthType.EXISTING, label: t(ToolsetI18nKey.ExistingClient) }];

  const methods: SelectOption[] = [
    { value: BasicI18nKey.None, label: t(BasicI18nKey.None) },
    { value: ToolsetCodeChallengeMethod.PLAIN, label: ToolsetCodeChallengeMethod.PLAIN },
    { value: ToolsetCodeChallengeMethod.S256, label: ToolsetCodeChallengeMethod.S256 },
  ];

  const isLoggedIn = useMemo(() => {
    return (
      authSettings?.globalAuthStatus === ToolsetAuthStatus.SIGNED_IN ||
      authSettings?.userLevelAuthStatus === ToolsetAuthStatus.SIGNED_IN
    );
  }, [authSettings]);

  const isAuthDisabled = disabled || isLoggedIn;

  return (
    <div className="flex flex-col pl-[26px]">
      {isLoggedIn && (
        <div className="mb-3">
          <DialAlert variant={AlertVariant.Info} message={t(ToolsetI18nKey.AuthSettingsLockedMessage)} />
        </div>
      )}
      <DialSelectField
        id="type"
        disabled={isAuthDisabled}
        label={t(ToolsetI18nKey.ClientRegistrationType)}
        value={AuthType.EXISTING}
        options={types}
        onChange={(type) => {
          onChange?.({
            ...(authSettings || {}),
            clientId: type === AuthType.EXISTING ? '' : undefined,
          } as ToolsetAuthSettings);
        }}
      />

      <div className="flex flex-col gap-y-3 mt-3 w-full">
        <ClientIdControl
          clientId={authSettings?.clientId}
          disabled={isAuthDisabled}
          isLoggedIn={isLoggedIn}
          onChange={(clientId) => onChange?.({ ...(authSettings || {}), clientId } as ToolsetAuthSettings)}
        />
        <ClientSecretControl
          clientSecret={authSettings?.clientSecret}
          disabled={isAuthDisabled}
          isLoggedIn={isLoggedIn}
          onChange={(clientSecret) => onChange?.({ ...(authSettings || {}), clientSecret } as ToolsetAuthSettings)}
        />
        <Multiselect
          elementId="scopes"
          disabled={isAuthDisabled}
          selectedItems={authSettings?.scopesSupported}
          allItems={authSettings?.scopesSupported}
          onChangeItems={(scopesSupported: string[]) => {
            onChange?.({ ...(authSettings || {}), scopesSupported } as ToolsetAuthSettings);
          }}
          heading={t(EntityFieldsI18nKey.scopes)}
          label={t(EntityFieldsI18nKey.scopes)}
          addTitle={t(BasicI18nKey.AddField)}
        />

        <EndpointControl
          disabled={isAuthDisabled}
          required
          id="authEndpoint"
          label={t(EntityFieldsI18nKey.authorizationEndpoint)}
          endpoint={authSettings?.authorizationEndpoint || ''}
          placeholder={t(EntityPlaceholdersI18nKey.AuthorizationEndpoint)}
          onChange={(authorizationEndpoint) =>
            onChange?.({ ...(authSettings || {}), authorizationEndpoint } as ToolsetAuthSettings)
          }
        />

        <EndpointControl
          id="tokenEndpoint"
          disabled={isAuthDisabled}
          required
          label={t(EntityFieldsI18nKey.tokenEndpoint)}
          endpoint={authSettings?.tokenEndpoint || ''}
          placeholder={t(EntityPlaceholdersI18nKey.TokenEndpoint)}
          onChange={(tokenEndpoint) => onChange?.({ ...(authSettings || {}), tokenEndpoint } as ToolsetAuthSettings)}
        />

        <DialSelectField
          containerClassName="w-[192px]"
          id="type"
          disabled={isAuthDisabled}
          label={t(EntityFieldsI18nKey.codeChallengeMethod)}
          value={!authSettings?.codeChallengeMethod ? BasicI18nKey.None : authSettings.codeChallengeMethod}
          options={methods}
          onChange={(codeChallengeMethod) => {
            onChange?.({
              ...(authSettings || {}),
              codeChallengeMethod: codeChallengeMethod === BasicI18nKey.None ? '' : codeChallengeMethod,
              codeChallenge: view === ApplicationRoute.AssetsToolsets ? authSettings?.codeChallenge : undefined,
              codeVerifier: view === ApplicationRoute.AssetsToolsets ? authSettings?.codeVerifier : undefined,
            } as ToolsetAuthSettings);
          }}
        />
      </div>
    </div>
  );
};

export default OAuthSection;
