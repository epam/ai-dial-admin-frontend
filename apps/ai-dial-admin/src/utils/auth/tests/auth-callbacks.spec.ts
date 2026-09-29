import { beforeEach, describe, expect, test, vi } from 'vitest';

const { mockGetOrCreateClient, mockGetRefreshToken, mockSetRefreshToken } = vi.hoisted(() => ({
  mockGetOrCreateClient: vi.fn(),
  mockGetRefreshToken: vi.fn(),
  mockSetRefreshToken: vi.fn(),
}));

vi.mock('../nextauth-client', () => ({
  NextClient: {
    delay: vi.fn(),
    getOrCreateClient: mockGetOrCreateClient,
    getRefreshToken: mockGetRefreshToken,
    setIsRefreshTokenStart: mockSetRefreshToken,
    setClient: vi.fn(),
  },
}));

vi.mock('@/src/server/logger', () => ({
  errorObjLog: vi.fn(),
  warnLog: vi.fn(),
}));

import { refreshAccessToken } from '../auth-callbacks';

describe('refreshAccessToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRefreshToken.mockReturnValue(undefined);
  });

  test('refreshes with a recovered client when no login-time client is cached', async () => {
    const client = {
      refresh: vi.fn(async () => ({
        access_token: 'replacement-access-token',
        expires_in: 300,
        refresh_token: 'replacement-refresh-token',
      })),
    };
    mockGetOrCreateClient.mockResolvedValue(client);

    const result = await refreshAccessToken({
      access_token: 'expired-access-token',
      accessTokenExpires: 0,
      providerId: 'gitlab',
      refreshToken: 'existing-refresh-token',
      userId: 'user-1',
    } as any);

    expect(mockGetOrCreateClient).toHaveBeenCalledWith('gitlab');
    expect(client.refresh).toHaveBeenCalledWith('existing-refresh-token');
    expect(result).toMatchObject({
      access_token: 'replacement-access-token',
      refreshToken: 'replacement-refresh-token',
    });
  });

  test('returns the existing refresh error outcome when the provider client cannot be recovered', async () => {
    mockGetOrCreateClient.mockResolvedValue(null);
    const token = {
      access_token: 'expired-access-token',
      accessTokenExpires: 0,
      providerId: 'ping-id',
      refreshToken: 'existing-refresh-token',
      userId: 'user-1',
    };

    const result = await refreshAccessToken(token as any);

    expect(mockGetOrCreateClient).toHaveBeenCalledWith('ping-id');
    expect(result).toEqual({ ...token, error: 'RefreshAccessTokenError' });
  });
});
