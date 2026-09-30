import { describe, expect, test } from 'vitest';

import { getIsInvalidSession } from '../is-valid-session';

describe('getIsInvalidSession', () => {
  test('returns false if isEnableAuth is false', async () => {
    expect(await getIsInvalidSession(false, null)).toBe(false);
  });

  test('returns true if token is missing', async () => {
    expect(await getIsInvalidSession(true, null)).toBe(true);
    expect(await getIsInvalidSession(true, undefined)).toBe(true);
  });

  test('returns true if the refresh failed', async () => {
    expect(await getIsInvalidSession(true, { error: 'RefreshAccessTokenError' } as any)).toBe(true);
  });

  // Regression: the cookie's access token is past its expiry, but the session was refreshed server-side
  test('returns false for a token whose cookie expiry passed but that was refreshed', async () => {
    const token = { accessTokenExpires: Date.now() - 10000, access_token: 'refreshed' } as any;

    expect(await getIsInvalidSession(true, token)).toBe(false);
  });

  test('returns false for a valid token', async () => {
    expect(await getIsInvalidSession(true, { accessTokenExpires: Date.now() + 10000 } as any)).toBe(false);
  });
});
