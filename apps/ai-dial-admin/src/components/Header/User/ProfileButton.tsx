import { DialButton } from '@epam/ai-dial-ui-kit';
import { IconX } from '@tabler/icons-react';
import { useCallback } from 'react';

import { useAppContext } from '@/src/context/AppContext';
import { UserIcon } from './UserMenu/UserIcon';

const ProfileButton = () => {
  const { userMenuOpen, toggleUserMenu } = useAppContext();

  const onClick = useCallback(() => {
    toggleUserMenu();
  }, [toggleUserMenu]);

  return (
    <DialButton
      className="flex !h-full items-center justify-center text-secondary md:text-primary"
      onClick={onClick}
      data-qa="account-settings"
      aria-label="Account settings"
      iconBefore={userMenuOpen ? <IconX className="text-secondary" size={24} id="close-icon" /> : <UserIcon />}
    />
  );
};
export default ProfileButton;
