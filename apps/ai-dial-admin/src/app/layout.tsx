import { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

import classNames from 'classnames';

// @ts-ignore
import '@/src/app/[lang]/global.scss';
import Page403Wrapper from '@/src/components/Page403/Page403Wrapper';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { AccessMode } from '@/src/models/user-access';
import { getUserAccess } from '@/src/server/user-access';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getAppName } from '@/src/utils/env/get-app-name';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getIconPath } from '@/src/utils/themes/icon-path';
import { themesApi } from './api/api';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: getAppName(),
};

const inter = Inter({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-inter',
});

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang?: string }>;
}) {
  const { lang } = await params;
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }
  const { mode } = await getUserAccess();
  const themesConfig = await themesApi.getThemesConfiguration();
  const themeImages = await themesApi.getImages();

  const faviconUrl = themesConfig
    ? getIconPath(themesConfig?.images['admin-favicon'] || themesConfig?.images.favicon)
    : undefined;

  return (
    <html>
      <head>
        <link rel="icon" href={faviconUrl || '/favicon.ico'} sizes="any" type="image/png" />
        <link rel="apple-touch-icon" href={faviconUrl || '/favicon.ico'} type="image/png" />
      </head>
      <body className={classNames(inter.variable, 'font dial-body-text min-w-[360px]')}>
        {mode !== AccessMode.DENIED ? (
          children
        ) : (
          <Page403Wrapper lang={lang || 'en'} themesConfiguration={themesConfig} themeImages={themeImages} />
        )}
      </body>
    </html>
  );
}
