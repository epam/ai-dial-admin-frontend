import { AuthOptions } from 'next-auth';
import { callbacks } from './auth-callbacks';
import { cookies } from './auth-cookies';
import { authProviders } from './auth-providers';

export const authOptions = {
  providers: authProviders,
  cookies,
  callbacks,
  session: {
    strategy: 'jwt',
  },
} as AuthOptions;
