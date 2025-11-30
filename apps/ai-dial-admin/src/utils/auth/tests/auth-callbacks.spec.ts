import { describe, test, expect, vi, beforeEach } from 'vitest';
import { safeDecodeJwt, getUser, callbacks, refreshAccessToken, tokenConfig } from '../auth-callbacks';
import { NextClient } from '../nextauth-client';

describe('auth-callbacks', () => {
  test('safeDecodeJwt returns decoded payload for valid JWT', () => {
    const validJwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const result = safeDecodeJwt(validJwt);
    expect(result).toHaveProperty('sub', '1234567890');
    expect(result).toHaveProperty('name', 'John Doe');
  });

  test('safeDecodeJwt returns empty object for invalid JWT', () => {
    const result = safeDecodeJwt('invalid.jwt');
    expect(result).toEqual({});
  });

  test('getUser returns isAdmin true if roles match adminRoleNames', () => {
    process.env.DIAL_ROLES_FIELD = 'roles';
    process.env.ADMIN_ROLE_NAMES = 'admin,superuser';
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJhZG1pbiJdfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const result = getUser(jwt, 'provider');
    expect(result.isAdmin).toBe(true);
  });

  test('getUser returns isAdmin false if roles do not match adminRoleNames', () => {
    process.env.DIAL_ROLES_FIELD = 'roles';
    process.env.ADMIN_ROLE_NAMES = 'admin,superuser';
    const jwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlcyI6WyJ1c2VyIl19.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const result = getUser(jwt, 'provider');
    expect(result.isAdmin).toBe(false);
  });

  test('getUser returns isAdmin false if no roles', () => {
    process.env.DIAL_ROLES_FIELD = 'roles';
    process.env.ADMIN_ROLE_NAMES = 'admin,superuser';
    const jwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const result = getUser(jwt, 'provider');
    expect(result.isAdmin).toBe(false);
  });

  test('getUser returns isAdmin false if jwt is empty', () => {
    process.env.AUTH_PROVIDER_DIAL_ROLES_FIELD = 'roles';
    process.env.AUTH_PROVIDER_ADMIN_ROLE_NAMES = 'admin,superuser';
    const result = getUser(void 0, 'provider');
    expect(result.isAdmin).toBe(false);
  });

  test('getUser returns isAdmin false if roles do not match adminRoleNames', () => {
    delete process.env.AUTH_PROVIDER_DIAL_ROLES_FIELD;
    delete process.env.AUTH_PROVIDER_ADMIN_ROLE_NAMES;
    const result = getUser(void 0, 'provider');
    expect(result.isAdmin).toBe(false);
  });

  test('signIn callback returns false if no access_token', async () => {
    const result = await callbacks.signIn!({ account: {} } as any);
    expect(result).toBe(false);
  });

  test('signIn callback returns true if access_token exists', async () => {
    const result = await callbacks.signIn!({ account: { access_token: 'token' } } as any);
    expect(result).toBe(true);
  });

  test('session callback sets error if token.error exists', async () => {
    const session = { user: {} };
    const token = { error: 'err', user: {} };
    const result = (await callbacks.session!({ session, token } as any)) as any;
    expect(result.error).toBe('err');
  });

  test('session callback sets providerId if session.user exists', async () => {
    const session = { user: {} };
    const token = { providerId: 'prov', user: {} };
    const result = (await callbacks.session!({ session, token } as any)) as any;
    expect(result.providerId).toBe('prov');
  });

  describe('tokenConfig', () => {
    test('calls client.callback when provider.idToken is true', async () => {
      const callbackSpy = vi.fn().mockResolvedValue('tokens-cb');
      const client = { callback: callbackSpy };
      const context = {
        client,
        provider: { idToken: true, callbackUrl: 'url', id: 'provider' },
        params: {},
        checks: {},
      };
      const result = await tokenConfig.request?.(context as any);
      expect(callbackSpy).toHaveBeenCalledWith('url', {}, {});
      expect(result).toEqual({ tokens: 'tokens-cb' });
    });

    test('calls client.oauthCallback when provider.idToken is false', async () => {
      const oauthCallbackSpy = vi.fn().mockResolvedValue('tokens-oauth');
      const client = { oauthCallback: oauthCallbackSpy };
      const context = {
        client,
        provider: { idToken: false, callbackUrl: 'url', id: 'provider' },
        params: {},
        checks: {},
      };
      const result = await tokenConfig.request?.(context as any);
      expect(oauthCallbackSpy).toHaveBeenCalledWith('url', {}, {});
      expect(result).toEqual({ tokens: 'tokens-oauth' });
    });
  });

  const mockToken = {
    providerId: 'provider',
    userId: 'user1',
    refreshToken: 'refresh-token',
    accessTokenExpires: Date.now() - 1000, // expired
    access_token: 'old-access-token',
    user: { isAdmin: false },
  };

  describe('refreshAccessToken', () => {
    let client: any;
    beforeEach(() => {
      client = {
        refresh: vi.fn().mockResolvedValue({
          access_token: 'new-access-token',
          expires_in: 3600,
          refresh_token: 'new-refresh-token',
        }),
      };
      NextClient.setClient(client, { id: 'provider' });
      vi.spyOn(NextClient, 'getRefreshToken').mockImplementation(() => undefined);
      vi.spyOn(NextClient, 'setIsRefreshTokenStart').mockImplementation(() => {});
      vi.spyOn(NextClient, 'delay').mockResolvedValue(undefined);
    });

    test('refreshes token and returns new token', async () => {
      const result = await refreshAccessToken({ ...mockToken });
      expect(result.access_token).toBe('new-access-token');
      expect(result.refreshToken).toBe('new-refresh-token');
      expect(result.accessTokenExpires).toBeGreaterThan(Date.now());
      expect(result.user).toBeDefined();
    });

    test('returns error if no providerId', async () => {
      const result = (await refreshAccessToken({ ...mockToken, providerId: undefined })) as any;
      expect(result.error).toBe('RefreshAccessTokenError');
    });

    test('returns error if no client', async () => {
      NextClient.setClient(null, { id: 'provider' });
      const result = (await refreshAccessToken({ ...mockToken })) as any;
      expect(result.error).toBe('RefreshAccessTokenError');
    });

    test('returns error if refresh throws', async () => {
      client.refresh.mockRejectedValue(new Error('fail'));
      const result = (await refreshAccessToken({ ...mockToken })) as any;
      expect(result.error).toBe('RefreshAccessTokenError');
    });

    test('returns error if refreshedTokens missing expires_in and expires_at', async () => {
      client.refresh.mockResolvedValue({ access_token: 'x', refresh_token: 'y' });
      const result = (await refreshAccessToken({ ...mockToken })) as any;
      expect(result.error).toBe('RefreshAccessTokenError');
    });

    test('returns error if no refresh_token in refreshedTokens and token', async () => {
      client.refresh.mockResolvedValue({ access_token: 'x', expires_in: 3600 });
      const result = (await refreshAccessToken({ ...mockToken, refreshToken: undefined })) as any;
      expect(result.error).toBe('RefreshAccessTokenError');
    });

    test('returns old token if not expired', async () => {
      vi.spyOn(Date, 'now').mockReturnValue(1000);
      vi.spyOn(NextClient, 'getRefreshToken').mockImplementation(() => ({
        isRefreshing: true,
        token: { ...mockToken, accessTokenExpires: 2000 },
      }));
      const result = await refreshAccessToken({ ...mockToken, accessTokenExpires: 2000 });
      expect(result.accessTokenExpires).toBe(2000);
    });
  });
});
