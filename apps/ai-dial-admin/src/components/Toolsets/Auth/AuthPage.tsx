'use client';

import { Spinner } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';
import { FC, useEffect } from 'react';

import { getUrl } from './utils';

interface Props {
  oAuthCode?: string | null;
}
export const AuthPage: FC<Props> = ({ oAuthCode }) => {
  const router = useRouter();

  useEffect(() => {
    const url = getUrl();
    if (url) {
      router.push(`${url}code=${oAuthCode ?? ''}`);
    }
  }, [oAuthCode, router]);

  return <Spinner size={44} fullWidth />;
};
