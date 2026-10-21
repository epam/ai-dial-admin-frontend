'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

import { SESSION_REFETCH_INTERVAL_SEC } from '@/src/constants/auth';

export const NextAuthProvider = ({ children }: { children: ReactNode }) => {
  return <SessionProvider refetchInterval={SESSION_REFETCH_INTERVAL_SEC}>{children}</SessionProvider>;
};
