import { beforeEach, describe, expect, test, vi } from 'vitest';

const { mockAuthProviders, mockClient, mockDiscover, mockIssuer } = vi.hoisted(() => {
  const client = {};
  class MockClient {
    public constructor() {
      return client;
    }
  }
  const issuer = vi.fn(function () {
    return { Client: MockClient };
  });
  const discover = vi.fn(async () => ({ Client: MockClient }));

  return {
    mockAuthProviders: [] as { id: string }[],
    mockClient: client,
    mockDiscover: discover,
    mockIssuer: Object.assign(issuer, { discover }),
  };
});

vi.mock('../auth-providers', () => ({
  authProviders: mockAuthProviders,
}));

vi.mock('openid-client', () => ({
  custom: {
    clock_tolerance: Symbol('clock_tolerance'),
    setHttpOptionsDefaults: vi.fn(),
  },
  Issuer: mockIssuer,
}));

import { NextClient } from '../nextauth-client';

describe('NextClient', () => {
  beforeEach(() => {
    const globalObj = globalThis as any;
    globalObj._client = {};
    mockAuthProviders.length = 0;
    mockDiscover.mockClear();
    mockIssuer.mockClear();
  });

  test('setClient and getClient store and retrieve client by provider id', () => {
    const client = { id: 'client1' };

    NextClient.setClient(client as any, { id: 'provider1' });
    expect(NextClient.getClient('provider1')).toEqual(client);
    expect(NextClient.getClient('provider2')).toBeNull();
  });

  test('getClient returns null if not set', () => {
    expect(NextClient.getClient('unknown')).toBeNull();
  });

  test('reuses a cached client without loading configured providers', async () => {
    NextClient.setClient(mockClient as any, { id: 'provider1' });

    const client = await NextClient.getOrCreateClient('provider1');

    expect(client).toBe(mockClient);
    expect(mockDiscover).not.toHaveBeenCalled();
    expect(mockIssuer).not.toHaveBeenCalled();
  });

  test('discovers, creates, and caches a client for a configured provider', async () => {
    mockAuthProviders.push({
      id: 'gitlab',
      clientId: 'client-id',
      clientSecret: 'client-secret',
      wellKnown: 'https://gitlab.example/.well-known/openid-configuration',
      options: {},
    } as any);

    const client = await NextClient.getOrCreateClient('gitlab');

    expect(mockDiscover).toHaveBeenCalledWith('https://gitlab.example/.well-known/openid-configuration');
    expect(client).toBe(mockClient);
    expect(NextClient.getClient('gitlab')).toBe(mockClient);
  });

  test('creates a client from verified issuer and token endpoint metadata', async () => {
    mockAuthProviders.push({
      id: 'provider1',
      clientId: 'client-id',
      issuer: 'https://issuer.example',
      token: { url: 'https://issuer.example/oauth/token' },
      options: {},
    } as any);

    const client = await NextClient.getOrCreateClient('provider1');

    expect(mockIssuer).toHaveBeenCalledWith(
      expect.objectContaining({
        issuer: 'https://issuer.example',
        token_endpoint: 'https://issuer.example/oauth/token',
      }),
    );
    expect(client).toBe(mockClient);
  });

  test('returns null when provider metadata cannot safely construct a client', async () => {
    mockAuthProviders.push({ id: 'ping-id', clientId: 'client-id', options: {} } as any);

    const client = await NextClient.getOrCreateClient('ping-id');

    expect(client).toBeNull();
    expect(mockDiscover).not.toHaveBeenCalled();
    expect(mockIssuer).not.toHaveBeenCalled();
  });
});

const HOUR = 60 * 60 * 1000;

const expiredToken = (overrides: Record<string, unknown> = {}) =>
  ({
    access_token: 'expired-access-token',
    accessTokenExpires: Date.now() - 1000,
    providerId: 'keycloak',
    refreshToken: 'refresh-1',
    sessionKey: 'session-1',
    userId: 'user-1',
    ...overrides,
  }) as any;

const refreshedFrom = (base: any, suffix = 'new') => ({
  ...base,
  access_token: `access-${suffix}`,
  accessTokenExpires: Date.now() + HOUR,
  refreshToken: `refresh-${suffix}`,
});

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

describe('NextClient.refreshOnce', () => {
  beforeEach(() => {
    (globalThis as any)._refreshStates = new Map();
  });

  test('runs one refresh for parallel callers of the same session', async () => {
    const pending = deferred<any>();
    const refresh = vi.fn(() => pending.promise);
    const token = expiredToken();

    const calls = [1, 2, 3].map(() => NextClient.refreshOnce(token, refresh));
    pending.resolve(refreshedFrom(token));
    const results = await Promise.all(calls);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(new Set(results.map((result) => result.access_token))).toEqual(new Set(['access-new']));
  });

  test('keeps later refreshes single-flight after the first one completed', async () => {
    const token = expiredToken();
    const first = await NextClient.refreshOnce(token, async (base) => refreshedFrom(base, 'first'));
    const expiredAgain = { ...first, accessTokenExpires: Date.now() - 1000 };
    (globalThis as any)._refreshStates.set('session-1', { latest: expiredAgain });
    const pending = deferred<any>();
    const refresh = vi.fn(() => pending.promise);

    const calls = [1, 2].map(() => NextClient.refreshOnce(expiredAgain, refresh));
    pending.resolve(refreshedFrom(expiredAgain, 'second'));
    const results = await Promise.all(calls);

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(results.map((result) => result.access_token)).toEqual(['access-second', 'access-second']);
  });

  test('releases the refresh after a failure and does not cache it', async () => {
    const token = expiredToken();
    const failed = await NextClient.refreshOnce(token, async (base) => ({ ...base, error: 'RefreshAccessTokenError' }));
    const refresh = vi.fn(async (base: any) => refreshedFrom(base));

    const result = await NextClient.refreshOnce(token, refresh);

    expect(failed.error).toBe('RefreshAccessTokenError');
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(result.error).toBeUndefined();
  });

  test('releases the refresh when it throws', async () => {
    const token = expiredToken();
    await expect(
      NextClient.refreshOnce(token, async () => {
        throw new Error('network');
      }),
    ).rejects.toThrow('network');
    const refresh = vi.fn(async (base: any) => refreshedFrom(base));

    await NextClient.refreshOnce(token, refresh);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  test('returns the newer refreshed token for a stale cookie without calling the IdP', async () => {
    const token = expiredToken();
    await NextClient.refreshOnce(token, async (base) => refreshedFrom(base));
    const refresh = vi.fn();

    const result = await NextClient.refreshOnce(token, refresh);

    expect(refresh).not.toHaveBeenCalled();
    expect(result.access_token).toBe('access-new');
  });

  test('refreshes with the newest known refresh token', async () => {
    const token = expiredToken();
    const first = await NextClient.refreshOnce(token, async (base) => refreshedFrom(base, 'first'));
    (globalThis as any)._refreshStates.set('session-1', { latest: { ...first, accessTokenExpires: Date.now() - 500 } });
    const refresh = vi.fn(async (base: any) => refreshedFrom(base, 'second'));

    await NextClient.refreshOnce(token, refresh);

    expect(refresh).toHaveBeenCalledWith(expect.objectContaining({ refreshToken: 'refresh-first' }));
  });

  test('returns a still-valid presented token as is', async () => {
    const token = expiredToken({ accessTokenExpires: Date.now() + HOUR });
    const refresh = vi.fn();

    const result = await NextClient.refreshOnce(token, refresh);

    expect(refresh).not.toHaveBeenCalled();
    expect(result).toBe(token);
  });

  test('keeps separate sign-ins of the same user apart', async () => {
    await NextClient.refreshOnce(expiredToken(), async (base) => refreshedFrom(base, 'browser-a'));
    const other = expiredToken({ sessionKey: 'session-2', refreshToken: 'refresh-2' });
    const refresh = vi.fn(async (base: any) => refreshedFrom(base, 'browser-b'));

    const result = await NextClient.refreshOnce(other, refresh);

    expect(refresh).toHaveBeenCalledWith(expect.objectContaining({ refreshToken: 'refresh-2' }));
    expect(result.access_token).toBe('access-browser-b');
  });

  test('falls back to the refresh token as key for sessions without a session key', async () => {
    const legacy = expiredToken({ sessionKey: undefined });
    await NextClient.refreshOnce(legacy, async (base) => refreshedFrom(base));
    const refresh = vi.fn();

    const result = await NextClient.refreshOnce(legacy, refresh);

    expect(refresh).not.toHaveBeenCalled();
    expect(result.access_token).toBe('access-new');
  });

  test('refreshes directly when the token has no key at all', async () => {
    const keyless = expiredToken({ sessionKey: undefined, refreshToken: undefined });
    const refresh = vi.fn(async (base: any) => refreshedFrom(base));

    await NextClient.refreshOnce(keyless, refresh);

    expect(refresh).toHaveBeenCalledWith(keyless);
  });

  test('evicts states of sessions abandoned for more than a day', async () => {
    const states = (globalThis as any)._refreshStates as Map<string, any>;
    states.set('abandoned', { latest: { accessTokenExpires: Date.now() - 25 * HOUR } });
    states.set('recent', { latest: { accessTokenExpires: Date.now() - HOUR } });

    await NextClient.refreshOnce(expiredToken(), async (base) => refreshedFrom(base));

    expect(states.has('abandoned')).toBe(false);
    expect(states.has('recent')).toBe(true);
  });

  test('clearRefreshState removes only the given session', async () => {
    await NextClient.refreshOnce(expiredToken(), async (base) => refreshedFrom(base, 'a'));
    await NextClient.refreshOnce(expiredToken({ sessionKey: 'session-2' }), async (base) => refreshedFrom(base, 'b'));

    NextClient.clearRefreshState(expiredToken());
    NextClient.clearRefreshState(undefined);

    const states = (globalThis as any)._refreshStates as Map<string, any>;
    expect(states.has('session-1')).toBe(false);
    expect(states.has('session-2')).toBe(true);
  });
});
