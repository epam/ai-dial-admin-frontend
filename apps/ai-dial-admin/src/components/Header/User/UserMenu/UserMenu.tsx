import { DialConfirmationPopup, DialDropdown } from '@epam/ai-dial-ui-kit';
import { FC, useEffect, useState } from 'react';

import SettingsModal from '@/src/components/SettingsModal/SettingsModal';
import { AuthI18nKey, GlobalI18nKey } from '@/src/constants/i18n';
import { useTheme } from '@/src/context/ThemeContext';
import { useLogout } from '@/src/hooks/use-logout';
import { useI18n } from '@/src/locales/client';
import LogoutItem from './LogoutItem';
import SettingsItem from './SettingsItem';
import { UserIcon } from './UserIcon';

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
          <UserIcon userName={session?.user?.name || t(GlobalI18nKey.User)} />
          <div className="flex flex-col gap-3 p-4">
            {themes?.length && <SettingsItem onClick={handleSettingsClick} />}
            {isEnableAuth && <LogoutItem session={session} onClick={handleLogOutClick} />}
          </div>
        </div>
      ) : (
        <DialDropdown
          listClassName="!w-[280px]"
          onOpenChange={(open) => setIsOpen(open)}
          renderOverlay={() => (
            <div className="flex flex-col w-[280px]">
              <div className="flex flex-row items-center gap-3 border-b border-secondary p-3">
                <UserIcon userName={session?.user?.name || t(GlobalI18nKey.User)} />

                <p className="dial-small-semi-text">{session?.user?.name}</p>
              </div>
              {themes?.length && (
                <div className="px-3 hover:bg-accent-primary-alpha h-[34px] flex items-center cursor-pointer">
                  <SettingsItem onClick={handleSettingsClick} />
                </div>
              )}
              {isEnableAuth && (
                <div className="px-3 hover:bg-accent-primary-alpha h-[34px] flex items-center cursor-pointer">
                  <LogoutItem session={session} onClick={handleLogOutClick} />
                </div>
              )}
            </div>
          )}
        >
          <div role="menuitem" className="flex cursor-pointer items-center justify-between gap-2 pr-6">
            <UserIcon userName={session?.user?.name || t(GlobalI18nKey.User)} />
          </div>
        </DialDropdown>
      )}
      {isLogoutConfirmationOpen && (
        <DialConfirmationPopup
          open={isLogoutConfirmationOpen}
          header={t(AuthI18nKey.ModalTitle)}
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
          isModalOpen={isSettingsModalOpen}
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
