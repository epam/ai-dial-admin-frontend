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

import { NextClient, RefreshToken } from '../nextauth-client';

describe('NextClient', () => {
  beforeEach(() => {
    const globalObj = globalThis as any;
    globalObj._client = {};
    globalObj._refreshTokenMap = {};
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

  test('setIsRefreshTokenStart and getRefreshToken store and retrieve refresh token', () => {
    const refreshToken: RefreshToken = { isRefreshing: true, token: { access_token: 'abc' } as any };
    NextClient.setIsRefreshTokenStart('user1', refreshToken);
    expect(NextClient.getRefreshToken('user1')).toEqual(refreshToken);
    expect(NextClient.getRefreshToken('user2')).toBeUndefined();
  });

  test('getRefreshToken returns undefined if not set', () => {
    expect(NextClient.getRefreshToken('unknown')).toBeUndefined();
  });

  test('delay resolves after timeout', async () => {
    const result = await NextClient.delay();
    expect(result).toBeUndefined();
  });
});
