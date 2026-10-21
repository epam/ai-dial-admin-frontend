import { NextAuthToken, Token } from '@/src/models/auth';
import { GetTokenParams, getToken } from 'next-auth/jwt';

import { isAccessTokenExpired } from './token-expiry';

// The cookie is only rewritten by `/api/auth/session`, so server-side reads refresh an expired token
// themselves. The result is not persisted; repeated reads reuse it through `refreshAccessToken`.
const getRefreshedToken = async (token: NextAuthToken): Promise<NextAuthToken> => {
  if (token.providerId === 'credentials' || !isAccessTokenExpired(token)) {
    return token;
  }

  // Lazy import: auth-callbacks imports this module
  const { refreshAccessToken } = await import('./auth-callbacks');
  return refreshAccessToken(token);
};

export const getFullToken = async (params: GetTokenParams): Promise<Token> => {
  const decodedToken = await getToken(params);

  if (!decodedToken) return;
  const tokenObj = await getRefreshedToken(decodedToken as NextAuthToken);
  const providerId = typeof tokenObj.providerId === 'string' ? tokenObj.providerId : '';

  const listProviders = getListProvidersPassIdToken();
  const tokenToReturn =
    listProviders.length && listProviders.includes(providerId) ? tokenObj.idToken : tokenObj.access_token;
  return { token: tokenToReturn as string, ...tokenObj } as Token;
};

export const getListProvidersPassIdToken = () => {
  const listProviders = process.env.AUTH_IDTOKEN_PROVIDERS?.split(',').map((str) => str.trim());
  return listProviders || [];
};
