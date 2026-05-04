'use client';
import Link from 'next/link';
import { FC } from 'react';

import { useTheme } from '@/src/context/ThemeContext';
import { getIconPath } from '@/src/utils/themes/icon-path';

const Logo: FC = () => {
  const { currentThemeLogo } = useTheme();

  return (
    <div className="absolute left-1/2 lg:left-[130px] top-0 flex h-full -translate-x-1/2 justify-center text-primary">
      {currentThemeLogo ? (
        <Link
          href="/"
          aria-label="Admin logo"
          style={{ backgroundImage: `url(${getIconPath(currentThemeLogo)})` }}
          className="bg-right bg-no-repeat min-w-[125px] h-full bg-contain"
        />
      ) : null}
    </div>
  );
};

export default Logo;
