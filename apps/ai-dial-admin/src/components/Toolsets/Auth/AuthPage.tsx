'use client';

import { DialLoader } from '@epam/ai-dial-ui-kit';
import { useRouter } from 'next/router';
import { FC } from 'react';

import { getUrl } from './utils';

interface Props {
  oAuthCode?: string | null;
}
export const AuthPage: FC<Props> = ({ oAuthCode }) => {
  const router = useRouter();

  router.push(`${getUrl()}code=${oAuthCode ?? ''}`);

  return <DialLoader size={44} />;
};
