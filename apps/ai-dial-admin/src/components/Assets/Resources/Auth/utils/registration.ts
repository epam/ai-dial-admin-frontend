import { ClientRegistrationMode } from '@/src/components/Assets/Resources/Auth/models';
import { BasicI18nKey } from '@/src/constants/i18n';
import {
  DialToolsetResourceAuthSettings,
  TokenEndpointAuthMethod,
  ToolsetAuthType,
  ToolsetCodeChallengeMethod,
} from '@/src/models/dial/resource';

// Only a stored Core-registered client is derivable from the settings. An unsaved "Register
// automatically" choice has no marker in them, so the section holds that one in local state.
export const getRegistrationMode = (authSettings?: DialToolsetResourceAuthSettings): ClientRegistrationMode =>
  authSettings?.dynamically_registered ? ClientRegistrationMode.Registered : ClientRegistrationMode.Existing;

// Core answers 400 to a registration body that carries a value in any other OAuth field, so keep
// nothing but the type and the URL.
export const toAutomaticSettings = (
  authSettings?: DialToolsetResourceAuthSettings,
): DialToolsetResourceAuthSettings => {
  const settings: DialToolsetResourceAuthSettings = { authentication_type: ToolsetAuthType.OAUTH };
  if (authSettings?.discovery_url != null) {
    settings.discovery_url = authSettings.discovery_url;
  }
  return settings;
};

export const toExistingSettings = (
  authSettings: DialToolsetResourceAuthSettings | undefined,
  redirectUri?: string,
): DialToolsetResourceAuthSettings => ({
  ...toAutomaticSettings(authSettings),
  client_id: '',
  redirect_uri: redirectUri,
});

// "None" must send a blank method: Core keeps the stored one when the key is omitted, and only a
// blank removes PKCE. With no method stored there is nothing to clear, so the key stays omitted.
export const toCodeChallengeMethod = (
  selected: string,
  current?: DialToolsetResourceAuthSettings['code_challenge_method'],
): DialToolsetResourceAuthSettings['code_challenge_method'] => {
  if (selected !== BasicI18nKey.None) return selected as ToolsetCodeChallengeMethod;
  return current ? '' : undefined;
};

// The PKCE pair, endpoints, scopes, resource and stored redirect_uri stay as read: Core keeps the
// pair while `code_challenge_method` is unchanged, and sign-in never reads `redirect_uri`.
export const toStaticFromRegistered = (
  authSettings?: DialToolsetResourceAuthSettings,
): DialToolsetResourceAuthSettings => ({
  ...authSettings,
  dynamically_registered: false,
  client_id: '',
  client_secret: '',
  token_endpoint_auth_method:
    authSettings?.token_endpoint_auth_method === TokenEndpointAuthMethod.CLIENT_SECRET_NONE
      ? TokenEndpointAuthMethod.CLIENT_SECRET_BASIC
      : authSettings?.token_endpoint_auth_method,
});
