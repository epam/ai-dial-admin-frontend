import { describe, expect, test } from 'vitest';

import { ACCESS_TOKEN_EXPIRY_MARGIN_MS } from '@/src/constants/auth';
import { isAccessTokenExpired } from '../token-expiry';

const NOW = 1_000_000;

describe('isAccessTokenExpired', () => {
  test('treats a token without an expiry as expired', () => {
    expect(isAccessTokenExpired({}, NOW)).toBe(true);
    expect(isAccessTokenExpired(undefined, NOW)).toBe(true);
  });

  test('treats a token inside the safety margin as expired', () => {
    expect(isAccessTokenExpired({ accessTokenExpires: NOW + ACCESS_TOKEN_EXPIRY_MARGIN_MS - 1 }, NOW)).toBe(true);
    expect(isAccessTokenExpired({ accessTokenExpires: NOW + ACCESS_TOKEN_EXPIRY_MARGIN_MS }, NOW)).toBe(true);
  });

  test('treats a token valid beyond the safety margin as not expired', () => {
    expect(isAccessTokenExpired({ accessTokenExpires: NOW + ACCESS_TOKEN_EXPIRY_MARGIN_MS + 1 }, NOW)).toBe(false);
  });
});
