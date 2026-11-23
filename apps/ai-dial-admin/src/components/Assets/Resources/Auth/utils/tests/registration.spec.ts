import { describe, expect, test } from 'vitest';

import { ClientRegistrationMode } from '@/src/components/Assets/Resources/Auth/models';
import {
  getRegistrationMode,
  toAutomaticSettings,
  toCodeChallengeMethod,
  toExistingSettings,
  toStaticFromRegistered,
} from '@/src/components/Assets/Resources/Auth/utils/registration';
import { BasicI18nKey } from '@/src/constants/i18n';
import {
  DialToolsetResourceAuthSettings,
  TokenEndpointAuthMethod,
  ToolsetAuthType,
  ToolsetCodeChallengeMethod,
} from '@/src/models/dial/resource';

const registered: DialToolsetResourceAuthSettings = {
  authentication_type: ToolsetAuthType.OAUTH,
  discovery_url: 'https://mcp.example.com/mcp',
  dynamically_registered: true,
  client_id: 'registered-id',
  authorization_endpoint: 'https://auth.example.com/authorize',
  token_endpoint: 'https://auth.example.com/token',
  redirect_uri: 'https://chat.example.com/callback',
  scopes_supported: ['crm.read'],
  resource: 'https://mcp.example.com/mcp',
  token_endpoint_auth_method: TokenEndpointAuthMethod.CLIENT_SECRET_NONE,
  code_challenge_method: ToolsetCodeChallengeMethod.S256,
  code_challenge: 'E9Melhoa',
};

describe('getRegistrationMode', () => {
  test('returns Registered for a client Core registered', () => {
    expect(getRegistrationMode(registered)).toBe(ClientRegistrationMode.Registered);
  });

  test('returns Existing for a static client', () => {
    expect(getRegistrationMode({ ...registered, dynamically_registered: false })).toBe(ClientRegistrationMode.Existing);
  });

  test('returns Existing when the flag is absent or there are no settings', () => {
    expect(getRegistrationMode({ authentication_type: ToolsetAuthType.OAUTH })).toBe(ClientRegistrationMode.Existing);
    expect(getRegistrationMode(undefined)).toBe(ClientRegistrationMode.Existing);
  });
});

describe('toAutomaticSettings', () => {
  test('keeps only the type and the Discovery URL', () => {
    expect(toAutomaticSettings({ ...registered, client_secret: 'secret', client_secret_hint: 'cret' })).toEqual({
      authentication_type: ToolsetAuthType.OAUTH,
      discovery_url: 'https://mcp.example.com/mcp',
    });
  });

  test('drops redirect_uri that choosing OAUTH filled in', () => {
    const result = toAutomaticSettings({
      authentication_type: ToolsetAuthType.OAUTH,
      redirect_uri: 'https://admin.example.com/external-service-signin',
    });

    expect(result).toEqual({ authentication_type: ToolsetAuthType.OAUTH });
    expect('discovery_url' in result).toBe(false);
  });

  test('keeps a blank Discovery URL as typed', () => {
    expect(toAutomaticSettings({ discovery_url: '' })).toEqual({
      authentication_type: ToolsetAuthType.OAUTH,
      discovery_url: '',
    });
  });

  test('returns just the type for no settings', () => {
    expect(toAutomaticSettings(undefined)).toEqual({ authentication_type: ToolsetAuthType.OAUTH });
  });
});

describe('toExistingSettings', () => {
  test('restores the redirect URI and an empty client id, keeping the Discovery URL', () => {
    expect(
      toExistingSettings(
        { authentication_type: ToolsetAuthType.OAUTH, discovery_url: 'https://mcp.example.com/mcp' },
        'https://admin.example.com/external-service-signin',
      ),
    ).toEqual({
      authentication_type: ToolsetAuthType.OAUTH,
      discovery_url: 'https://mcp.example.com/mcp',
      client_id: '',
      redirect_uri: 'https://admin.example.com/external-service-signin',
    });
  });

  test('leaves redirect_uri unset when none is given', () => {
    expect(toExistingSettings(undefined).redirect_uri).toBeUndefined();
  });
});

describe('toStaticFromRegistered', () => {
  test('clears the client credentials and the registered flag, keeping everything else as read', () => {
    expect(toStaticFromRegistered(registered)).toEqual({
      ...registered,
      dynamically_registered: false,
      client_id: '',
      client_secret: '',
      token_endpoint_auth_method: TokenEndpointAuthMethod.CLIENT_SECRET_BASIC,
    });
  });

  test('keeps a method that works with a secret', () => {
    expect(
      toStaticFromRegistered({ ...registered, token_endpoint_auth_method: TokenEndpointAuthMethod.CLIENT_SECRET_POST })
        .token_endpoint_auth_method,
    ).toBe(TokenEndpointAuthMethod.CLIENT_SECRET_POST);
  });

  test('leaves the method unset when there was none', () => {
    expect(
      toStaticFromRegistered({ ...registered, token_endpoint_auth_method: undefined }).token_endpoint_auth_method,
    ).toBeUndefined();
  });

  test('handles no settings', () => {
    expect(toStaticFromRegistered(undefined)).toEqual({
      dynamically_registered: false,
      client_id: '',
      client_secret: '',
      token_endpoint_auth_method: undefined,
    });
  });
});

describe('toCodeChallengeMethod', () => {
  test('returns a chosen method as is', () => {
    expect(toCodeChallengeMethod(ToolsetCodeChallengeMethod.S256, undefined)).toBe(ToolsetCodeChallengeMethod.S256);
  });

  test('returns a blank method for None when a method was set, so Core removes PKCE', () => {
    expect(toCodeChallengeMethod(BasicI18nKey.None, ToolsetCodeChallengeMethod.S256)).toBe('');
  });

  test('omits the method for None when none was set', () => {
    expect(toCodeChallengeMethod(BasicI18nKey.None, undefined)).toBeUndefined();
    expect(toCodeChallengeMethod(BasicI18nKey.None, '')).toBeUndefined();
  });
});
