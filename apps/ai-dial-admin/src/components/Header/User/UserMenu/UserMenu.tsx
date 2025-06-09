import { IconChevronDown } from '@tabler/icons-react';
import { FC, useState } from 'react';

import ConfirmationModal from '@/src/components/Common/ConfirmationModal/ConfirmationModal';
import Dropdown from '@/src/components/Common/Dropdown/Dropdown';
import DropdownMenuItem from '@/src/components/Common/Dropdown/DropdownItem';
import SettingsModal from '@/src/components/SettingsModal/SettingsModal';
import { AuthI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useTheme } from '@/src/context/ThemeContext';
import { useLogout } from '@/src/hooks/use-logout';
import { useI18n } from '@/src/locales/client';
import { PopUpState } from '@/src/types/pop-up';
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
  const [logoutConfirmationState, setLogoutConfirmationState] = useState(PopUpState.Closed);
  const [settingsModalState, setSettingsModalState] = useState(PopUpState.Closed);
  const { session, handleLogout } = useLogout();
  const { setTheme, themes } = useTheme();

  const applySettings = ({ theme }: { theme?: string }) => {
    setTheme(theme as string);
  };

  const handleSettingsClick = () => setSettingsModalState(PopUpState.Opened);
  const handleLogOutClick = () => {
    if (!session) {
      handleLogout();
      return;
    }
    setLogoutConfirmationState(PopUpState.Opened);
  };

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
      {logoutConfirmationState === PopUpState.Opened && (
        <ConfirmationModal
          modalState={logoutConfirmationState}
          heading={t(AuthI18nKey.ModalTitle)}
          description={t(AuthI18nKey.ModalDescription)}
          confirmLabel={t(AuthI18nKey.Logout)}
          onClose={() => setLogoutConfirmationState(PopUpState.Closed)}
          onConfirm={() => {
            setLogoutConfirmationState(PopUpState.Closed);
            handleLogout();
          }}
        />
      )}
      {settingsModalState === PopUpState.Opened && (
        <SettingsModal
          modalState={settingsModalState}
          onClose={() => setSettingsModalState(PopUpState.Closed)}
          onConfirm={(settings) => {
            setSettingsModalState(PopUpState.Closed);
            applySettings(settings);
          }}
        />
      )}
    </>
  );
};
export default UserMenu;
