'use client';

import { FC } from 'react';
import { IconMenu2 } from '@tabler/icons-react';

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
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  return (
    <header className="h-[52px] z-40 flex w-full border-b border-tertiary bg-layer-3 relative justify-between">
      <div className="flex items-center px-3">
        <button
          type="button"
          aria-label="menu"
          aria-expanded={sidebarOpen}
          className="flex size-6 items-center justify-center rounded-full cursor-pointer text-secondary hover:bg-control-neutral-hover-muted focus-visible:bg-control-neutral-hover-muted"
          onClick={toggleSidebar}
        >
          <IconMenu2 size={16} stroke={1.5} aria-hidden />
        </button>
      </div>
      <div className="absolute left-1/2 lg:left-[48px] top-0 flex h-full -translate-x-1/2 lg:translate-x-0 items-center gap-2 justify-center text-primary">
        <Logo />
      </div>
      <div className="lg:flex-1 lg:min-w-0 lg:flex lg:flex-row lg:items-center lg:pl-[200px]">
        <Breadcrumbs mobile={false} />
      </div>

      <div className="flex items-center gap-3">
        {isReadOnlyAdmin && <ReadOnlyAdminBadge />}
        {docLink && <HelpButton docLink={docLink} />}
        <User isEnableAuth={isEnableAuth} />
      </div>
    </header>
  );
};

export default Header;
