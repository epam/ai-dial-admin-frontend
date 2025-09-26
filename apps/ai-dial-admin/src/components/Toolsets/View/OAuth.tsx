import { FC } from 'react';

import DropdownField from '@/src/components/Common/Dropdown/DropdownField';
import { TextInputField } from '@/src/components/Common/InputField/InputField';
import { EntityFieldsI18nKey, EntityPlaceholdersI18nKey, ToolsetI18nKey } from '@/src/constants/i18n';
import { useI18n } from '@/src/locales/client';
import { Toolset, ToolsetAuthSettings } from '@/src/models/dial/toolset';
import { DropdownItemsModel } from '@/src/models/dropdown-item';
import PasswordInputField from '@/src/components/Common/PasswordInput/PasswordInputField';
import EndpointControl from '../../EntityMainProperties/BaseProperties/Endpoint/Endpoint';

enum AuthType {
  DYNAMIC = 'dynamic',
  EXISTING = 'existing',
}
interface Props {
  toolset: Toolset;
  onChange: (entity: Toolset) => void;
}

const OAuthControls: FC<Props> = ({ toolset, onChange }) => {
  const t = useI18n();

  const types: DropdownItemsModel[] = [
    { id: AuthType.DYNAMIC, name: t(ToolsetI18nKey.DynamicRegistration) },
    { id: AuthType.EXISTING, name: t(ToolsetI18nKey.ExistingClient) },
  ];

  return (
    <div className="flex flex-col pl-[26px]">
      <div className="flex flex-row gap-x-4">
        <DropdownField
          containerCssClass="w-[192px]"
          elementId="type"
          fieldTitle={t(ToolsetI18nKey.ClientRegistrationType)}
          selectedValue={toolset.authSettings?.clientId == null ? AuthType.DYNAMIC : AuthType.EXISTING}
          items={types}
          onChange={(type: string) => {
            onChange({
              ...toolset,
              authSettings: {
                ...(toolset.authSettings || {}),
                clientId: type === AuthType.EXISTING ? '' : undefined,
              } as ToolsetAuthSettings,
            });
          }}
        />
        <TextInputField
          containerCssClass="w-[360px]"
          elementId="redirectUri"
          fieldTitle={t(EntityFieldsI18nKey.redirectUri)}
          value={toolset.authSettings?.redirectUri || ''}
          placeholder={t(EntityPlaceholdersI18nKey.RedirectUri)}
          onChange={(redirectUri) =>
            onChange({
              ...toolset,
              authSettings: { ...(toolset.authSettings || {}), redirectUri } as ToolsetAuthSettings,
            })
          }
        />
      </div>

      {toolset.authSettings?.clientId != null && (
        <div className="flex flex-col gap-y-3 mt-3 w-full">
          <TextInputField
            elementId="clientId"
            fieldTitle={t(EntityFieldsI18nKey.clientId)}
            value={toolset.authSettings?.clientId || ''}
            placeholder={t(EntityPlaceholdersI18nKey.ClientId)}
            onChange={(clientId) =>
              onChange({
                ...toolset,
                authSettings: { ...(toolset.authSettings || {}), clientId } as ToolsetAuthSettings,
              })
            }
          />
          <PasswordInputField
            elementId="clientSecret"
            fieldTitle={t(EntityFieldsI18nKey.clientSecret)}
            value={toolset.authSettings?.clientSecret || ''}
            placeholder={t(EntityPlaceholdersI18nKey.ClientSecret)}
            onChange={(clientSecret) =>
              onChange({
                ...toolset,
                authSettings: { ...(toolset.authSettings || {}), clientSecret } as ToolsetAuthSettings,
              })
            }
          />

          <EndpointControl
            id="authEndpoint"
            fieldTitle={t(EntityFieldsI18nKey.authEndpoint)}
            endpoint={toolset.authSettings?.authorizationEndpoint || ''}
            placeholder={t(EntityPlaceholdersI18nKey.AuthorizationEndpoint)}
            onChange={(authorizationEndpoint) =>
              onChange({
                ...toolset,
                authSettings: { ...(toolset.authSettings || {}), authorizationEndpoint } as ToolsetAuthSettings,
              })
            }
          />

          <EndpointControl
            id="tokenEndpoint"
            fieldTitle={t(EntityFieldsI18nKey.tokenEndpoint)}
            endpoint={toolset.authSettings?.tokenEndpoint || ''}
            placeholder={t(EntityPlaceholdersI18nKey.TokenEndpoint)}
            onChange={(tokenEndpoint) =>
              onChange({
                ...toolset,
                authSettings: { ...(toolset.authSettings || {}), tokenEndpoint } as ToolsetAuthSettings,
              })
            }
          />
        </div>
      )}
    </div>
  );
};

export default OAuthControls;
