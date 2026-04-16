import { FC } from 'react';

import ProfileButton from './ProfileButton';
import UserMenu from './UserMenu/UserMenu';

interface Props {
  isEnableAuth: boolean;
}

const User: FC<Props> = ({ isEnableAuth }) => {
  return (
    <>
      <div className="h-full lg:hidden border-l border-l-tertiary lg:border-none flex items-center">
        <ProfileButton />
      </div>

      <div className="hidden lg:flex">
        <UserMenu isMobile={false} isEnableAuth={isEnableAuth} />
      </div>
    </>
  );
};

export default User;
