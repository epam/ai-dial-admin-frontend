import { JWT } from 'next-auth/jwt';

import { ACCESS_TOKEN_EXPIRY_MARGIN_MS } from '@/src/constants/auth';

export const isAccessTokenExpired = (token: JWT | null | undefined, now = Date.now()): boolean => {
  const expires = token?.accessTokenExpires;

  return typeof expires !== 'number' || now >= expires - ACCESS_TOKEN_EXPIRY_MARGIN_MS;
};
