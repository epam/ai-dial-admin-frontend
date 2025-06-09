'use client';
import classNames from 'classnames';
import { FC, ReactNode, useEffect, useState } from 'react';

import SidebarClose from '@/public/images/icons/sidebar-close.svg';
import SidebarOpen from '@/public/images/icons/sidebar-open.svg';
import Breadcrumbs from '@/src/components/Breadcrumbs/Breadcrumbs';
import Button from '@/src/components/Common/Button/Button';
import { useAppContext } from '@/src/context/AppContext';
import Logo from './Logo';
import User from './User/User';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';

interface Props {
  isEnableAuth: boolean;
}

const Header: FC<Props> = ({ isEnableAuth }) => {
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const [sidebarIcon, setSidebarIcon] = useState<ReactNode>(<SidebarClose />);
  const isTabletScreen = useIsTabletScreen();

  useEffect(() => {
    setSidebarIcon(sidebarOpen ? <SidebarClose /> : <SidebarOpen />);
  }, [sidebarOpen]);

  return (
    <header className={classNames('z-40 flex w-full border-b border-tertiary bg-layer-3')}>
      <div className="flex">
        <Button
          cssClass="py-3 px-5 border-r border-r-tertiary focus-within:outline-offset-[-1px] focus:text-accent-primary hover:text-accent-primary"
          onClick={toggleSidebar}
          iconBefore={sidebarIcon}
        />
      </div>
      <Logo />
      <div className="lg:flex-1 lg:min-w-0 lg:flex lg:flex-row lg:items-center">
        {!isTabletScreen && <Breadcrumbs mobile={false} />}
      </div>

      <User isEnableAuth={isEnableAuth} />
    </header>
  );
};

export default Header;
