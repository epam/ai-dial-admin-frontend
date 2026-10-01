import { AuthOptions } from 'next-auth';
import { NextAuthToken } from '@/src/models/auth';
import { requestRegistry } from '@/src/utils/api/request-registry';
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
    signOut: async ({ token }) => {
      requestRegistry.cancelAll();
      NextClient.clearRefreshState(token as NextAuthToken | null);
    },
  },
  pages: {
    signOut: '/',
    error: '/',
  },
} as AuthOptions;
