'use client';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/navigation';
import { FC, useEffect } from 'react';

import { getExternalServiceUrl } from './external-service-auth-utils';

interface Props {
  oAuthCode?: string | null;
}

export const ExternalServiceSignInPage: FC<Props> = ({ oAuthCode }) => {
  const router = useRouter();

  useEffect(() => {
    const url = getExternalServiceUrl();
    if (url) {
      router.push(`${url}code=${oAuthCode ?? ''}`);
    }
  }, [oAuthCode, router]);

  return <DialLoader size={44} />;
};
