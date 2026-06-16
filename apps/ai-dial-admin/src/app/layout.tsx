import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

import classNames from 'classnames';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import '@/src/app/[lang]/global.scss';
import Page403 from '@/src/components/Page403/Page403';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getIconPath } from '@/src/utils/themes/icon-path';
import { themesApi, utilityApi } from './api/api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: process.env.APP_NAME || 'AI Dial Admin',
};

const inter = Inter({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-inter',
});

export default async function RootLayout({ children }: { children: ReactNode }) {
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }
  const userInfo = await utilityApi.getUserInfo(token);
  const themesConfig = await themesApi.getThemesConfiguration();

  const faviconUrl = themesConfig
    ? getIconPath(themesConfig?.images['admin-favicon'] || themesConfig?.images.favicon)
    : undefined;

  return (
    <html>
      <head>
        <link rel="icon" href={faviconUrl || '/favicon.ico'} sizes="any" type="image/png" />
        <link rel="apple-touch-icon" href={faviconUrl || '/favicon.ico'} type="image/png" />
      </head>
      <body className={classNames(inter.variable, 'font min-w-[360px]')}>
        {userInfo.success ? children : <Page403 />}
      </body>
    </html>
  );
}
