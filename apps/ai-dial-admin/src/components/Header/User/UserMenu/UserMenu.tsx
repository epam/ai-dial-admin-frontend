import { ConfirmationPopup, Dropdown, DropdownItem, EllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { IconLogout, IconSettings } from '@tabler/icons-react';
import { FC, useEffect, useState } from 'react';

import SettingsModal from '@/src/components/SettingsModal/SettingsModal';
import { AuthI18nKey, SettingsModalI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useTheme } from '@/src/context/ThemeContext';
import { useLogout } from '@/src/hooks/use-logout';
import { useI18n } from '@/src/locales/client';
import AvatarButton from '@/src/components/Header/User/AvatarButton';
import { UserIcon } from './UserIcon';

const settingsIcon = <IconSettings {...BASE_BUTTON_ICON_PROPS} aria-hidden />;
const logoutIcon = <IconLogout {...BASE_BUTTON_ICON_PROPS} aria-hidden />;

interface Props {
  isEnableAuth: boolean;
}

const UserMenu: FC<Props> = ({ isEnableAuth }) => {
  const t = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutConfirmationOpen, setIsLogoutConfirmationOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const { session, handleLogout } = useLogout();
  const { setTheme, themes } = useTheme();

  const applySettings = ({ theme }: { theme?: string }) => {
    setTheme(theme as string);
  };

  const handleSettingsClick = () => {
    setIsSettingsModalOpen(true);
  };

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

  const hasSettings = Boolean(themes?.length);
  const settingsLabel = t(SettingsModalI18nKey.Settings);
  const logoutLabel = session ? t(AuthI18nKey.Logout) : t(AuthI18nKey.Login);
  const isLogoutDanger = Boolean(session);

  const dropdownItems: DropdownItem[] = [];
  if (hasSettings) {
    dropdownItems.push({ key: 'settings', label: settingsLabel, icon: settingsIcon, onClick: handleSettingsClick });
  }
  if (isEnableAuth) {
    dropdownItems.push({
      key: 'logout',
      label: logoutLabel,
      icon: logoutIcon,
      danger: isLogoutDanger,
      onClick: handleLogOutClick,
    });
  }

  return (
    <>
      <Dropdown
        listClassName="!w-[280px] mt-2"
        placement="bottom-end"
        onOpenChange={(open) => setIsOpen(open)}
        items={dropdownItems}
        menuHeader={
          <div className="flex flex-row items-center gap-3 border-b border-secondary p-3">
            <UserIcon />

            <div className="flex min-w-0 flex-col">
              <EllipsisTooltip text={<span className="dial-small-semi-text">{session?.user?.name}</span>} />
              {session?.user?.email && (
                <EllipsisTooltip text={<span className="dial-tiny-text text-secondary">{session.user.email}</span>} />
              )}
            </div>
          </div>
        }
      >
        <AvatarButton isActive={isOpen} tooltip={session?.user?.name ?? undefined} />
      </Dropdown>
      {isLogoutConfirmationOpen && (
        <ConfirmationPopup
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
