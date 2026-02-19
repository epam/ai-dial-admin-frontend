import { Token } from '@/src/models/auth';
import { DefaultSession, getServerSession } from 'next-auth';
import { authOptions } from './auth-options';

export const getIsInvalidSession = async (isEnableAuth: boolean, token: Token) => {
  if (!isEnableAuth) {
    return false;
  }
  const session = (await getServerSession(authOptions)) as DefaultSession & {
    error?: string;
  };
  const isInvalidSession = session == null || session.error != null;

  const isTokenInvalid =
    token == null || (typeof token.accessTokenExpires === 'number' && Date.now() > token.accessTokenExpires);

  return isInvalidSession || isTokenInvalid;
};
