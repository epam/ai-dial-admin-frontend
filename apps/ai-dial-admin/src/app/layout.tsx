import { Inter } from 'next/font/google';
import { ReactNode } from 'react';
import { Metadata } from 'next';

import { getIconPath } from '@/src/utils/themes/icon-path';
import { themesApi } from './api/api';

import '@/src/app/[lang]/global.scss';

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
      <body className={`${inter.variable} font min-w-[360px]`}>{children}</body>
    </html>
  );
}
