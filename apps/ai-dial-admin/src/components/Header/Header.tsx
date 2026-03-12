'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import { DialIconButton } from '@epam/ai-dial-ui-kit';

import SidebarClose from '@/public/images/icons/sidebar-close.svg';
import SidebarOpen from '@/public/images/icons/sidebar-open.svg';
import Breadcrumbs from '@/src/components/Breadcrumbs/Breadcrumbs';
import { useAppContext } from '@/src/context/AppContext';
import HelpButton from './HelpButton/HelpButton';
import Logo from './Logo';
import User from './User/User';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';

interface Props {
  isEnableAuth: boolean;
  docLink?: string;
}

const Header: FC<Props> = ({ isEnableAuth, docLink }) => {
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const [sidebarIcon, setSidebarIcon] = useState<ReactNode>(<SidebarClose />);
  const isTabletScreen = useIsTabletScreen();

  useEffect(() => {
    setSidebarIcon(sidebarOpen ? <SidebarClose /> : <SidebarOpen />);
  }, [sidebarOpen]);

  return (
    <header className="z-40 flex w-full border-b border-tertiary bg-layer-3 relative justify-between">
      <div className="flex">
        <DialIconButton
          aria-label="menu"
          className="py-3 px-5 border-r size-auto border-r-tertiary text-secondary focus-within:outline-offset-[-1px] focus:text-accent-primary hover:text-accent-primary"
          onClick={toggleSidebar}
          icon={sidebarIcon}
        />
      </div>
      <Logo />
      <div className="lg:flex-1 lg:min-w-0 lg:flex lg:flex-row lg:items-center lg:pl-[200px]">
        {!isTabletScreen && <Breadcrumbs mobile={false} />}
      </div>

      <div className="flex items-center">
        {docLink && <HelpButton docLink={docLink} />}
        <div className="w-px h-[16px] bg-controls-disable-accent ml-2 mr-[-8px]" />
        <User isEnableAuth={isEnableAuth} />
      </div>
    </header>
  );
};

export default Header;
