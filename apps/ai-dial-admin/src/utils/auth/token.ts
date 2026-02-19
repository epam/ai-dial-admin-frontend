import { Token } from '@/src/models/auth';
import { GetTokenParams, getToken } from 'next-auth/jwt';

export const getFullToken = async (params: GetTokenParams): Promise<Token> => {
  const tokenObj = await getToken(params);

  if (!tokenObj) return;
  const providerId = typeof tokenObj.providerId === 'string' ? tokenObj.providerId : '';

  const listProviders = getListProvidersPassIdToken();
  const tokenToReturn =
    listProviders.length && listProviders.includes(providerId) ? tokenObj.idToken : tokenObj.access_token;
  return { token: tokenToReturn as string, ...tokenObj };
};

export const getListProvidersPassIdToken = () => {
  const listProviders = process.env.AUTH_IDTOKEN_PROVIDER?.split(',').map((str) => str.trim());
  return listProviders || [];
};
