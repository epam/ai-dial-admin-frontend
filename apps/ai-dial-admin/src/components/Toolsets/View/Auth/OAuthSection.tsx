import { FC } from 'react';

import { DialPasswordInputField, DialSelectField, DialTextInputField, SelectOption } from '@epam/ai-dial-ui-kit';

import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import EndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/Endpoint';
import { BasicI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ToolsetAuthSettings, ToolsetCodeChallengeMethod } from '@/src/models/dial/toolset';

enum AuthType {
  DYNAMIC = 'dynamic',
  EXISTING = 'existing',
}

interface Props {
  authSettings?: ToolsetAuthSettings;
  onChange: (entity: ToolsetAuthSettings) => void;
}

const OAuthSection: FC<Props> = ({ authSettings, onChange }) => {
  const t = useI18n();

  const types: SelectOption[] = [{ value: AuthType.EXISTING, label: t(ToolsetI18nKey.ExistingClient) }];

  const methods: SelectOption[] = [
    { value: BasicI18nKey.None, label: t(BasicI18nKey.None) },
    { value: ToolsetCodeChallengeMethod.PLAIN, label: ToolsetCodeChallengeMethod.PLAIN },
    { value: ToolsetCodeChallengeMethod.S256, label: ToolsetCodeChallengeMethod.S256 },
  ];

  return (
    <div className="flex flex-col pl-[26px]">
      <div className="flex flex-row gap-x-4">
        <DialSelectField
          containerCssClass="w-[192px]"
          elementId="type"
          fieldTitle={t(ToolsetI18nKey.ClientRegistrationType)}
          value={AuthType.EXISTING}
          options={types}
          onChange={(type) => {
            onChange({
              ...(authSettings || {}),
              clientId: type === AuthType.EXISTING ? '' : undefined,
            } as ToolsetAuthSettings);
          }}
        />
        <div className="flex-1 min-w-0">
          <DialTextInputField
            elementId="redirectUri"
            fieldTitle={t(EntityFieldsI18nKey.redirectUri)}
            value={authSettings?.redirectUri || ''}
            placeholder={t(EntityPlaceholdersI18nKey.RedirectUri)}
            onChange={(redirectUri) => onChange({ ...(authSettings || {}), redirectUri } as ToolsetAuthSettings)}
          />
        </div>
      </div>

      {authSettings?.clientId != null && (
        <div className="flex flex-col gap-y-3 mt-3 w-full">
          <DialTextInputField
            elementId="clientId"
            fieldTitle={t(EntityFieldsI18nKey.clientId)}
            value={authSettings?.clientId || ''}
            placeholder={t(EntityPlaceholdersI18nKey.ClientId)}
            onChange={(clientId) => onChange({ ...(authSettings || {}), clientId })}
          />
          <DialPasswordInputField
            elementId="clientSecret"
            fieldTitle={t(EntityFieldsI18nKey.clientSecret)}
            value={authSettings?.clientSecret || ''}
            placeholder={t(EntityPlaceholdersI18nKey.ClientSecret)}
            onChange={(clientSecret) => onChange({ ...(authSettings || {}), clientSecret })}
          />
          <Multiselect
            elementId="scopes"
            selectedItems={authSettings.scopesSupported}
            allItems={authSettings.scopesSupported}
            onChangeItems={(scopesSupported: string[]) => {
              onChange({ ...(authSettings || {}), scopesSupported });
            }}
            heading={t(EntityFieldsI18nKey.scopes)}
            title={t(EntityFieldsI18nKey.scopes)}
            addTitle={t(BasicI18nKey.AddField)}
          />
          <EndpointControl
            id="authEndpoint"
            fieldTitle={t(EntityFieldsI18nKey.authorizationEndpoint)}
            endpoint={authSettings?.authorizationEndpoint || ''}
            placeholder={t(EntityPlaceholdersI18nKey.AuthorizationEndpoint)}
            onChange={(authorizationEndpoint) => onChange({ ...(authSettings || {}), authorizationEndpoint })}
          />

          <EndpointControl
            id="tokenEndpoint"
            fieldTitle={t(EntityFieldsI18nKey.tokenEndpoint)}
            endpoint={authSettings?.tokenEndpoint || ''}
            placeholder={t(EntityPlaceholdersI18nKey.TokenEndpoint)}
            onChange={(tokenEndpoint) => onChange({ ...(authSettings || {}), tokenEndpoint })}
          />

          <DialSelectField
            containerCssClass="w-[192px]"
            elementId="type"
            fieldTitle={t(EntityFieldsI18nKey.codeChallengeMethod)}
            value={!authSettings.codeChallengeMethod ? BasicI18nKey.None : authSettings.codeChallengeMethod}
            options={methods}
            onChange={(codeChallengeMethod) => {
              onChange({
                ...(authSettings || {}),
                codeChallengeMethod: codeChallengeMethod === BasicI18nKey.None ? '' : codeChallengeMethod,
              } as ToolsetAuthSettings);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default OAuthSection;
