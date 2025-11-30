import { describe, test, expect, beforeEach } from 'vitest';
import { NextClient, RefreshToken } from '../nextauth-client';

describe('NextClient', () => {
  beforeEach(() => {
    // Reset global mocks before each test
    const globalObj = globalThis as any;
    globalObj._client = {};
    globalObj._refreshTokenMap = {};
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
