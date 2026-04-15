import { signIn, signOut, useSession } from 'next-auth/react';
import { useCallback } from 'react';
import { requestRegistry } from '@/src/utils/api/request-registry';

export const useLogout = () => {
  const { data: session } = useSession();
  const handleLogout = useCallback(() => {
    if (session) {
      requestRegistry.cancelAll();
      signOut({ redirect: true, callbackUrl: '/' });
    } else {
      signIn('azure-ad', { redirect: true });
    }
  }, [session]);

  return {
    session,
    handleLogout,
  };
};
