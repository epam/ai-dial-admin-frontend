import { FC } from 'react';

import { DialPasswordInputField, DialTextInputField } from '@epam/ai-dial-ui-kit';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import Multiselect from '@/src/components/Common/Multiselect/Multiselect';
import EndpointControl from '@/src/components/EntityMainProperties/BaseProperties/Endpoint/Endpoint';
import { BasicI18nKey, EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { ToolsetAuthSettings } from '@/src/models/dial/toolset';
import { DropdownItemsModel } from '@/src/models/dropdown-item';

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

  const types: DropdownItemsModel[] = [
    // { id: AuthType.DYNAMIC, name: t(ToolsetI18nKey.DynamicRegistration) },
    { id: AuthType.EXISTING, name: t(ToolsetI18nKey.ExistingClient) },
  ];

  return (
    <div className="flex flex-col pl-[26px]">
      <div className="flex flex-row gap-x-4">
        <DropdownField
          containerCssClass="w-[192px]"
          elementId="type"
          fieldTitle={t(ToolsetI18nKey.ClientRegistrationType)}
          selectedValue={authSettings?.clientId == null ? AuthType.DYNAMIC : AuthType.EXISTING}
          items={types}
          onChange={(type: string) => {
            onChange({
              ...(authSettings || {}),
              clientId: type === AuthType.EXISTING ? '' : undefined,
            } as ToolsetAuthSettings);
          }}
        />
        <DialTextInputField
          containerCssClass="w-[360px]"
          elementId="redirectUri"
          fieldTitle={t(EntityFieldsI18nKey.redirectUri)}
          value={authSettings?.redirectUri || ''}
          placeholder={t(EntityPlaceholdersI18nKey.RedirectUri)}
          onChange={(redirectUri) => onChange({ ...(authSettings || {}), redirectUri } as ToolsetAuthSettings)}
        />
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
        </div>
      )}
    </div>
  );
};

export default OAuthSection;
