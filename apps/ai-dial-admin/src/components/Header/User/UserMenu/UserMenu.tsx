import { IconChevronDown } from '@tabler/icons-react';
import { DialConfirmationPopup } from '@epam/ai-dial-ui-kit';
import { FC, useEffect, useState } from 'react';

import Dropdown from '@/src/components/Common/Dropdown/Dropdown';
import DropdownMenuItem from '@/src/components/Common/Dropdown/DropdownItem';
import SettingsModal from '@/src/components/SettingsModal/SettingsModal';
import { AuthI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useTheme } from '@/src/context/ThemeContext';
import { useLogout } from '@/src/hooks/use-logout';
import { useI18n } from '@/src/locales/client';
import LogoutItem from './LogoutItem';
import SettingsItem from './SettingsItem';
import UserInfo from './UserInfo';

interface Props {
  isEnableAuth: boolean;
  isMobile: boolean;
}

const UserMenu: FC<Props> = ({ isEnableAuth, isMobile }) => {
  const t = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutConfirmationOpen, setIsLogoutConfirmationOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const { session, handleLogout } = useLogout();
  const { setTheme, themes } = useTheme();

  const applySettings = ({ theme }: { theme?: string }) => {
    setTheme(theme as string);
  };

  const handleSettingsClick = () => setIsSettingsModalOpen(true);
  const handleLogOutClick = () => {
    if (!session) {
      handleLogout();
      return;
    }
    setIsLogoutConfirmationOpen(true);
  };

  useEffect(() => {
    if (!isOpen) return;

    const timeoutId = window.setTimeout(() => {
      const guards = document.querySelectorAll('[data-floating-ui-focus-guard]');
      guards.forEach((guard) => {
        guard.setAttribute('tabindex', '-1');
      });
    }, 10);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen]);

  return (
    <>
      {isMobile ? (
        <div className="flex flex-col w-full divide-y divide-tertiary">
          <UserInfo session={session} />
          <div className="flex flex-col gap-3 p-4">
            {themes?.length && <SettingsItem onClick={handleSettingsClick} />}
            {isEnableAuth && <LogoutItem session={session} onClick={handleLogOutClick} />}
          </div>
        </div>
      ) : (
        <Dropdown
          className="flex items-center"
          onOpenChange={setIsOpen}
          trigger={
            <div role="menuitem" className="flex min-w-[120px] cursor-pointer items-center justify-between gap-2 pr-3">
              <UserInfo session={session} />
              <IconChevronDown
                {...BASE_ICON_PROPS}
                className={`shrink-0 text-primary transition-all ${isOpen ? 'rotate-180' : ''}`}
              />
            </div>
          }
        >
          {themes?.length && (
            <DropdownMenuItem
              id="settings-menu-item"
              className="hover:bg-accent-primary-alpha"
              item={<SettingsItem />}
              onClick={handleSettingsClick}
            />
          )}
          {isEnableAuth && (
            <DropdownMenuItem
              id="logout-menu-item"
              className="hover:bg-accent-primary-alpha"
              item={<LogoutItem session={session} />}
              onClick={handleLogOutClick}
            />
          )}
        </Dropdown>
      )}
      {isLogoutConfirmationOpen && (
        <DialConfirmationPopup
          open={isLogoutConfirmationOpen}
          title={t(AuthI18nKey.ModalTitle)}
          description={t(AuthI18nKey.ModalDescription)}
          confirmLabel={t(AuthI18nKey.Logout)}
          onClose={() => setIsLogoutConfirmationOpen(false)}
          onConfirm={() => {
            setIsLogoutConfirmationOpen(false);
            handleLogout();
          }}
        />
      )}
      {isSettingsModalOpen && (
        <SettingsModal
          isSettingsModalOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onConfirm={(settings) => {
            setIsSettingsModalOpen(false);
            applySettings(settings);
          }}
        />
      )}
    </>
  );
};
export default UserMenu;
