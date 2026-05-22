'use client';
import Link from 'next/link';
import { FC } from 'react';

import { useTheme } from '@/src/context/ThemeContext';
import { getIconPath } from '@/src/utils/themes/icon-path';

const Logo: FC = () => {
  const { currentThemeLogo } = useTheme();

  return (
    <>
      {currentThemeLogo ? (
        <Link
          href="/"
          aria-label="Admin logo"
          style={{ backgroundImage: `url(${getIconPath(currentThemeLogo)})` }}
          className="bg-right bg-no-repeat min-w-[125px] h-full bg-contain shrink-0"
        />
      ) : null}
    </>
  );
};

export default Logo;
