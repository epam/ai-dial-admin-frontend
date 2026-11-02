'use client';
import Link from 'next/link';
import { FC } from 'react';

import { useTheme } from '@/src/context/ThemeContext';
import { getIconPath } from '@/src/utils/themes/icon-path';

interface Props {
  appName: string;
}

const Logo: FC<Props> = ({ appName }) => {
  const { currentThemeLogo } = useTheme();

  if (!currentThemeLogo) {
    return null;
  }

  return (
    <Link
      href="/"
      className="flex h-6 min-w-0 shrink select-none rounded focus-visible:outline focus-visible:outline-1 focus-visible:outline-focus"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- served by the themes service at runtime */}
      <img
        src={getIconPath(currentThemeLogo)}
        alt={appName}
        draggable={false}
        className="h-full w-auto min-w-0 max-w-[200px] object-contain object-left"
      />
    </Link>
  );
};

export default Logo;
