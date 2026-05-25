import { signIn, signOut, useSession } from 'next-auth/react';
import { useCallback } from 'react';

import { UserSession } from '@/src/models/auth';
import { requestRegistry } from '@/src/utils/api/request-registry';

export const useLogout = () => {
  const { data: session } = useSession();
  const handleLogout = useCallback(() => {
    if (session) {
      requestRegistry.cancelAll();
      const providerId = (session as UserSession).providerId;
      const callbackUrl = providerId === 'auth0' ? '/api/auth/logout?provider=auth0' : '/';
      signOut({ redirect: true, callbackUrl });
    } else {
      signIn('azure-ad', { redirect: true });
    }
  }, [session]);

  return {
    session,
    handleLogout,
  };
};
