import { Inter } from 'next/font/google';

import '@/src/app/[lang]/global.scss';
import { ReactNode } from 'react';
import { getIconPath } from '@/src/utils/themes/icon-path';
import { themesApi } from './api/api';

export const metadata = {
  title: process.env.APP_NAME || 'AI Dial Admin',
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
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const themesConfig = await themesApi.getThemesConfiguration();

  return (
    <html lang={lang}>
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
      <body className={`${inter.variable} font min-w-[360px]`}>{children}</body>
    </html>
  );
}
