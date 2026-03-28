import { AuthOptions } from 'next-auth';
import { callbacks } from './auth-callbacks';
import { cookies } from './auth-cookies';
import { authProviders } from './auth-providers';
import { NextClient } from './nextauth-client';

export const authOptions = {
  providers: authProviders,
  cookies,
  debug: process.env.NEXTAUTH_DEBUG,
  callbacks,
  session: {
    strategy: 'jwt',
  },
  events: {
    signOut: async () => {
      NextClient.clearAllRefreshTokens();
    },
  },
  pages: {
    signOut: '/',
    error: '/',
  },
} as AuthOptions;
