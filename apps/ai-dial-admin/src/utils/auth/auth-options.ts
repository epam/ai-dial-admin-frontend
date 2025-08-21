import { AuthOptions } from 'next-auth';
import { callbacks } from './auth-callbacks';
import { cookies } from './auth-cookies';
import { authProviders } from './auth-providers';

export const authOptions = {
  providers: authProviders,
  cookies,
  debug: process.env.NEXTAUTH_DEBUG,
  callbacks,
  session: {
    strategy: 'jwt',
  },
} as AuthOptions;
