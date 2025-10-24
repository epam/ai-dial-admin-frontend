import { IconX } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import { useCallback } from 'react';

import { useAppContext } from '@/src/context/AppContext';
import UserInfo from './UserMenu/UserInfo';

const ProfileButton = () => {
  const { userMenuOpen, toggleUserMenu } = useAppContext();

  const { data: session } = useSession();

  const onClick = useCallback(() => {
    toggleUserMenu();
  }, [toggleUserMenu]);

  return (
    <button
      className="flex size-full items-center pr-3 justify-center text-secondary md:text-primary"
      onClick={onClick}
      aria-label="Account settings"
    >
      {userMenuOpen ? (
        <IconX className="text-secondary" width={24} height={24} id="close-icon" />
      ) : (
        <UserInfo isMobile={true} session={session} />
      )}
    </button>
  );
};
export default ProfileButton;
