'use client';
import Link from 'next/link';
import { FC } from 'react';

import { useI18n } from '@/src/locales/client';
import { getIconPath } from '@/src/utils/themes/icon-path';
import { useTheme } from '@/src/context/ThemeContext';

const Logo: FC = () => {
  const t = useI18n();
  const { currentThemeLogo } = useTheme();

  return (
    <div className="absolute left-1/2 lg:left-[130px] top-0 flex h-full -translate-x-1/2 justify-center text-primary">
      {currentThemeLogo ? (
        <Link
          href="/"
          aria-label="Admin logo"
          style={{ backgroundImage: `url(${getIconPath(currentThemeLogo)})` }}
          className="bg-right bg-no-repeat min-w-[110px] h-full bg-contain"
        />
      ) : null}
      <Link className="relative" href="/" aria-label="Admin title">
        <h2 className="ml-2 absolute top-[12px]">{t('Admin')}</h2>
      </Link>
    </div>
  );
};

export default Logo;
