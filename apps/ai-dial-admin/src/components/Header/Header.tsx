'use client';

import { FC, ReactNode, useEffect, useState } from 'react';
import { DialIconButton } from '@epam/ai-dial-ui-kit';

import SidebarClose from '@/public/images/icons/sidebar-close.svg';
import SidebarOpen from '@/public/images/icons/sidebar-open.svg';
import Breadcrumbs from '@/src/components/Breadcrumbs/Breadcrumbs';
import ReadOnlyAdminBadge from '@/src/components/Common/ReadOnlyBadge/ReadOnlyBadge';
import { useAppContext } from '@/src/context/AppContext';
import HelpButton from './HelpButton/HelpButton';
import Logo from './Logo';
import User from './User/User';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';

interface Props {
  isEnableAuth: boolean;
  docLink?: string;
}

const Header: FC<Props> = ({ isEnableAuth, docLink }) => {
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const [sidebarIcon, setSidebarIcon] = useState<ReactNode>(<SidebarClose />);
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

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
      <div className="absolute left-1/2 lg:left-[88px] top-0 flex h-full -translate-x-1/2 lg:translate-x-0 items-center gap-2 justify-center text-primary">
        <Logo />
        {isReadOnlyAdmin && <ReadOnlyAdminBadge />}
      </div>
      <div className="lg:flex-1 lg:min-w-0 lg:flex lg:flex-row lg:items-center lg:pl-[200px]">
        <Breadcrumbs mobile={false} />
      </div>

      <div className="flex items-center gap-3">
        {docLink && <HelpButton docLink={docLink} />}
        <User isEnableAuth={isEnableAuth} />
      </div>
    </header>
  );
};

export default Header;
