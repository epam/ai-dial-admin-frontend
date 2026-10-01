import { Session, TokenSet } from 'next-auth';
import { JWT } from 'next-auth/jwt';

export type Token = NextAuthToken | undefined;
export interface NextAuthToken extends JWT {
  providerId: string;
  userId: string;
  refreshToken: string | TokenSet;
  // Random id assigned at sign-in; keeps the refresh state of separate sign-ins of the same user apart.
  sessionKey?: string;
  accessTokenExpires?: number;
  error?: string;
  token?: string;
}

export interface UserSession extends Session {
  providerId: string;
  error?: unknown;
}
