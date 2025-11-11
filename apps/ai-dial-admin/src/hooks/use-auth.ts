import { useSession } from 'next-auth/react';

export const useAuthConfig = () => {
  const { update } = useSession();
  return { update };
};
