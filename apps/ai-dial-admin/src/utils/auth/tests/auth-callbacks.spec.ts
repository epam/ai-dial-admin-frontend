import { beforeEach, describe, expect, test, vi } from 'vitest';

vi.mock('@/src/server/logger', () => ({
  errorObjLog: vi.fn(),
  warnLog: vi.fn(),
}));

import { ACCESS_TOKEN_EXPIRY_MARGIN_MS } from '@/src/constants/auth';
import { callbacks, refreshAccessToken } from '../auth-callbacks';
import { NextClient } from '../nextauth-client';

const HOUR = 60 * 60 * 1000;

const expiredToken = (overrides: Record<string, unknown> = {}) =>
  ({
    access_token: 'expired-access-token',
    accessTokenExpires: 0,
    providerId: 'keycloak',
    refreshToken: 'existing-refresh-token',
    sessionKey: 'session-1',
    userId: 'user-1',
    ...overrides,
  }) as any;

const idpResponse = (suffix = 'replacement') => ({
  access_token: `${suffix}-access-token`,
  expires_in: 1800,
  refresh_token: `${suffix}-refresh-token`,
});

const mockClient = (...responses: unknown[]) => {
  const refresh = vi.fn();
  responses.forEach((response) => {
    if (response instanceof Error) {
      refresh.mockRejectedValueOnce(response);
    } else {
      refresh.mockResolvedValueOnce(response);
    }
  });
  vi.spyOn(NextClient, 'getOrCreateClient').mockResolvedValue({ refresh } as any);
  return refresh;
};

describe('refreshAccessToken', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (globalThis as any)._refreshStates = new Map();
  });

  test('refreshes with a recovered client when no login-time client is cached', async () => {
    const refresh = mockClient(idpResponse());

    const result = await refreshAccessToken(expiredToken({ providerId: 'gitlab' }));

    expect(NextClient.getOrCreateClient).toHaveBeenCalledWith('gitlab');
    expect(refresh).toHaveBeenCalledWith('existing-refresh-token');
    expect(result).toMatchObject({
      access_token: 'replacement-access-token',
      refreshToken: 'replacement-refresh-token',
    });
  });

  test('returns the existing refresh error outcome when the provider client cannot be recovered', async () => {
    vi.spyOn(NextClient, 'getOrCreateClient').mockResolvedValue(null);
    const token = expiredToken({ providerId: 'ping-id' });

    const result = await refreshAccessToken(token);

    expect(NextClient.getOrCreateClient).toHaveBeenCalledWith('ping-id');
    expect(result).toEqual({ ...token, error: 'RefreshAccessTokenError' });
  });

  test('clears a stale refresh error after a successful refresh', async () => {
    mockClient(idpResponse());

    const result = await refreshAccessToken(expiredToken({ error: 'RefreshAccessTokenError' }));

    expect(result.error).toBeUndefined();
    expect(result.access_token).toBe('replacement-access-token');
  });

  test('refreshes again after a failed attempt', async () => {
    const refresh = mockClient(new Error('IdP unavailable'), idpResponse());
    const token = expiredToken();

    const failed = await refreshAccessToken(token);
    const recovered = await refreshAccessToken(token);

    expect(failed.error).toBe('RefreshAccessTokenError');
    expect(recovered.error).toBeUndefined();
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  test('refreshes a new sign-in normally after an earlier session failed', async () => {
    const refresh = mockClient(new Error('invalid_grant'), idpResponse('new-sign-in'));

    await refreshAccessToken(expiredToken());
    const result = await refreshAccessToken(
      expiredToken({ sessionKey: 'session-2', refreshToken: 'new-sign-in-refresh-token' }),
    );

    expect(refresh).toHaveBeenLastCalledWith('new-sign-in-refresh-token');
    expect(result.error).toBeUndefined();
  });

  test('returns the refresh error outcome for a token without a provider', async () => {
    const result = await refreshAccessToken(expiredToken({ providerId: undefined }));

    expect(result.error).toBe('RefreshAccessTokenError');
  });

  test('returns the refresh error outcome when the IdP response has no expiry', async () => {
    mockClient({ access_token: 'no-expiry' });

    const result = await refreshAccessToken(expiredToken());

    expect(result.error).toBe('RefreshAccessTokenError');
  });

  test('keeps the previous refresh token when the IdP does not issue a new one', async () => {
    mockClient({ access_token: 'replacement-access-token', expires_at: Date.now() / 1000 + 1800 });

    const result = await refreshAccessToken(expiredToken());

    expect(result.refreshToken).toBe('existing-refresh-token');
    expect(result.error).toBeUndefined();
  });

  test('sends one IdP request for parallel refreshes of the same session', async () => {
    const refresh = mockClient(idpResponse());
    const token = expiredToken();

    const results = await Promise.all([refreshAccessToken(token), refreshAccessToken(token)]);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(results[0]).toEqual(results[1]);
  });
});

describe('callbacks.jwt', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (globalThis as any)._refreshStates = new Map();
  });

  test('assigns a session key on sign-in', async () => {
    const result = await callbacks.jwt!({
      token: {},
      account: { provider: 'keycloak', access_token: 'access', expires_in: 1800, refresh_token: 'refresh' },
      user: { id: 'user-1' },
    } as any);

    expect(result.sessionKey).toEqual(expect.any(String));
  });

  test('gives separate sign-ins different session keys', async () => {
    const signIn = () =>
      callbacks.jwt!({
        token: {},
        account: { provider: 'keycloak', access_token: 'access', expires_in: 1800 },
        user: { id: 'user-1' },
      } as any);

    const [first, second] = await Promise.all([signIn(), signIn()]);

    expect(first.sessionKey).not.toBe(second.sessionKey);
  });

  test('refreshes a token that expires within the safety margin', async () => {
    const refresh = mockClient(idpResponse());
    const token = expiredToken({ accessTokenExpires: Date.now() + ACCESS_TOKEN_EXPIRY_MARGIN_MS / 2 });

    const result = await callbacks.jwt!({ token } as any);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(result.access_token).toBe('replacement-access-token');
  });

  test('keeps a token valid beyond the safety margin without refreshing', async () => {
    const refresh = mockClient(idpResponse());
    const token = expiredToken({ access_token: 'valid-access-token', accessTokenExpires: Date.now() + HOUR });

    const result = await callbacks.jwt!({ token } as any);

    expect(refresh).not.toHaveBeenCalled();
    expect(result.access_token).toBe('valid-access-token');
  });
});
