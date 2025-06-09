'use client';
import { FC } from 'react';
import classNames from 'classnames';

import { useAppContext } from '@/src/context/AppContext';
import { useIsMobileScreen } from '@/src/hooks/use-is-mobile-screen';

const Blackout: FC = () => {
  const isMobile = useIsMobileScreen();
  const { sidebarOpen } = useAppContext();
  const blackoutClassName = classNames('absolute inset-0 bg-blackout z-50');

  if (!isMobile || !sidebarOpen) {
    return null;
  }

  return <div role="presentation" className={blackoutClassName}></div>;
};

export default Blackout;
