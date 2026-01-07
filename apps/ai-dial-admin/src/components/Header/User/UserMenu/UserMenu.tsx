import { IconChevronDown } from '@tabler/icons-react';
import { DialConfirmationPopup, DialDropdown, DropdownItem } from '@epam/ai-dial-ui-kit';
import { FC, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';

import SettingsModal from '@/src/components/SettingsModal/SettingsModal';
import { AuthI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
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

  const dropdownItems: DropdownItem[] = useMemo(() => {
    const res = [];
    if (themes?.length) {
      res.push({ key: 'settings', label: <SettingsItem />, onClick: handleSettingsClick });
    }

    if (isEnableAuth) {
      res.push({
        key: 'logout',
        label: <LogoutItem session={session} />,
        onClick: () => {
          if (!session) {
            handleLogout();
          } else {
            setIsLogoutConfirmationOpen(true);
          }
        },
      });
    }
    return res;
  }, [handleLogout, isEnableAuth, session, themes?.length]);

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
        <DialDropdown menu={{ items: dropdownItems }} onOpenChange={(open) => setIsOpen(open)}>
          <div role="menuitem" className="flex min-w-[120px] cursor-pointer items-center justify-between gap-2 pr-6">
            <UserInfo session={session} />
            <IconChevronDown
              {...BASE_BUTTON_ICON_PROPS}
              className={classNames('shrink-0 text-primary transition-all', isOpen && 'rotate-180')}
            />
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
