import { IconX } from '@tabler/icons-react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useCallback } from 'react';

import UserIcon from '@/public/images/icons/user.svg';
import { useAppContext } from '@/src/context/AppContext';

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
      ) : session?.user?.image ? (
        <Image className="rounded" src={session?.user?.image} width={24} height={24} alt="User avatar" />
      ) : (
        <UserIcon width={24} height={24} />
      )}
    </button>
  );
};
export default ProfileButton;
