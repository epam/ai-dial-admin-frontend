import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import { ReactNode } from 'react';

import classNames from 'classnames';

import '@/src/app/[lang]/global.scss';
import Page403 from '@/src/components/Page403/Page403';
import { getUserToken } from '@/src/utils/auth/auth-request';
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
  const themesConfig = await themesApi.getThemesConfiguration();
  const token = await getUserToken(getIsEnableAuthToggle(), headers(), cookies());
  const isSecure = await utilityApi.getSecurityInfo(token);

  return (
    <html>
      <head>
        <link
          rel="icon"
          href={(themesConfig && getIconPath(themesConfig?.images.favicon)) || '/'}
          sizes="any"
          type="image/png"
        />
        <link
          rel="apple-touch-icon"
          href={(themesConfig && getIconPath(themesConfig?.images.favicon)) || '/'}
          type="image/png"
        />
      </head>
      <body className={classNames(inter.variable, 'font min-w-[360px]')}>
        {isSecure.success ? children : <Page403 />}
      </body>
    </html>
  );
}
