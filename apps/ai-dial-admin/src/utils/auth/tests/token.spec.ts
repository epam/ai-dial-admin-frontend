import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { mockGetToken, mockRefreshAccessToken } = vi.hoisted(() => ({
  mockGetToken: vi.fn(),
  mockRefreshAccessToken: vi.fn(),
}));

vi.mock('next-auth/jwt', () => ({ getToken: mockGetToken }));
vi.mock('../auth-callbacks', () => ({ refreshAccessToken: mockRefreshAccessToken }));

import { getFullToken } from '../token';

const HOUR = 60 * 60 * 1000;

describe('getFullToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test('returns undefined without a session cookie', async () => {
    mockGetToken.mockResolvedValue(null);

    expect(await getFullToken({} as any)).toBeUndefined();
    expect(mockRefreshAccessToken).not.toHaveBeenCalled();
  });

  test('refreshes an expired token and returns the refreshed bearer value', async () => {
    const expired = { providerId: 'keycloak', access_token: 'expired', accessTokenExpires: Date.now() - 1000 };
    mockGetToken.mockResolvedValue(expired);
    mockRefreshAccessToken.mockResolvedValue({
      ...expired,
      access_token: 'refreshed',
      accessTokenExpires: Date.now() + HOUR,
    });

    const result = await getFullToken({} as any);

    expect(mockRefreshAccessToken).toHaveBeenCalledWith(expired);
    expect(result).toMatchObject({ token: 'refreshed', access_token: 'refreshed' });
  });

  test('uses a valid token without refreshing', async () => {
    mockGetToken.mockResolvedValue({
      providerId: 'keycloak',
      access_token: 'valid',
      accessTokenExpires: Date.now() + HOUR,
    });

    const result = await getFullToken({} as any);

    expect(mockRefreshAccessToken).not.toHaveBeenCalled();
    expect(result?.token).toBe('valid');
  });

  test('passes a failed refresh through with its error', async () => {
    const expired = { providerId: 'keycloak', access_token: 'expired', accessTokenExpires: 0 };
    mockGetToken.mockResolvedValue(expired);
    mockRefreshAccessToken.mockResolvedValue({ ...expired, error: 'RefreshAccessTokenError' });

    const result = await getFullToken({} as any);

    expect(result?.error).toBe('RefreshAccessTokenError');
  });

  test('never refreshes credentials sessions', async () => {
    mockGetToken.mockResolvedValue({ providerId: 'credentials', access_token: 'static' });

    const result = await getFullToken({} as any);

    expect(mockRefreshAccessToken).not.toHaveBeenCalled();
    expect(result?.token).toBe('static');
  });

  test('returns the refreshed id token for id-token providers', async () => {
    vi.stubEnv('AUTH_IDTOKEN_PROVIDERS', 'keycloak');
    const expired = { providerId: 'keycloak', idToken: 'old-id', accessTokenExpires: 0 };
    mockGetToken.mockResolvedValue(expired);
    mockRefreshAccessToken.mockResolvedValue({ ...expired, idToken: 'new-id', accessTokenExpires: Date.now() + HOUR });

    const result = await getFullToken({} as any);

    expect(result?.token).toBe('new-id');
  });
});
