import { Session, TokenSet } from 'next-auth';
import { JWT } from 'next-auth/jwt';

export interface Token extends JWT {
  providerId: string;
  userId: string;
  refreshToken: string | TokenSet;
  token?: string;
}

export interface UserSession extends Session {
  providerId: string;
  error?: unknown;
}
