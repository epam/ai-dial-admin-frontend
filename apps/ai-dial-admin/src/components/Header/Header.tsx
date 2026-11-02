'use client';

import { GhostIconButton } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';
import { IconLayoutSidebar } from '@tabler/icons-react';

import Breadcrumbs from '@/src/components/Breadcrumbs/Breadcrumbs';
import ReadOnlyAdminBadge from '@/src/components/Common/ReadOnlyBadge/ReadOnlyBadge';
import { HeaderI18nKey } from '@/src/constants/i18n';
import { MAIN_MENU_ID } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import HelpButton from './HelpButton/HelpButton';
import Logo from './Logo';
import UserMenu from './User/UserMenu/UserMenu';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';

interface Props {
  isEnableAuth: boolean;
  appName: string;
  docLink?: string;
}

const Header: FC<Props> = ({ isEnableAuth, appName, docLink }) => {
  const t = useI18n();
  const { sidebarOpen, toggleSidebar } = useAppContext();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  return (
    <header className="relative z-40 flex h-12 w-full items-center gap-3 border-b border-tertiary bg-layer-base px-4 lg:pl-5 lg:pr-6">
      <div className="flex min-w-0 items-center gap-4 lg:gap-6">
        <GhostIconButton
          aria-label={t(HeaderI18nKey.ToggleSidebar)}
          aria-expanded={sidebarOpen}
          aria-controls={MAIN_MENU_ID}
          className="-m-2 shrink-0"
          icon={<IconLayoutSidebar size={24} stroke={1.5} aria-hidden />}
          onClick={toggleSidebar}
        />
        <Logo appName={appName} />
      </div>
      <div className="min-w-0 flex-1 overflow-hidden lg:pl-10">
        <Breadcrumbs mobile={false} />
      </div>

      <div className="flex shrink-0 items-center gap-5">
        {isReadOnlyAdmin && <ReadOnlyAdminBadge />}
        <div className="flex items-center gap-5 lg:gap-6">
          {docLink && (
            <div className="-m-2 flex">
              <HelpButton docLink={docLink} />
            </div>
          )}
          <div className="-m-2 flex">
            <UserMenu isEnableAuth={isEnableAuth} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
