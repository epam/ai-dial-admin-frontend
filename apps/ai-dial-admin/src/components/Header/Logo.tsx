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
    <div className="flex flex-row text-primary items-center flex-1 lg:flex-none min-w-0 py-3 px-4 justify-center lg:justify-start">
      {currentThemeLogo ? (
        <Link
          href="/"
          aria-label="Admin logo"
          style={{ backgroundImage: `url(${getIconPath(currentThemeLogo)})` }}
          className="bg-right bg-no-repeat min-w-[110px] h-full"
        ></Link>
      ) : null}
      <Link href="/" aria-label="Admin title">
        <h2 className="ml-2 mt-[-1.22px]">{t('Admin')}</h2>
      </Link>
    </div>
  );
};

export default Logo;
