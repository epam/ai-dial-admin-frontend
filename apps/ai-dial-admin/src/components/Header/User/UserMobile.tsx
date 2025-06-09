import { FC } from 'react';

import { useAppContext } from '@/src/context/AppContext';
import UserMenu from './UserMenu/UserMenu';

interface Props {
  isEnableAuth: boolean;
}

const UserMobile: FC<Props> = ({ isEnableAuth }) => {
  const { userMenuOpen } = useAppContext();

  return (
    userMenuOpen && (
      <div className="lg:hidden absolute right-0 top-0 bottom-0 w-[260px] z-[51] bg-layer-3">
        <UserMenu isMobile={true} isEnableAuth={isEnableAuth} />
      </div>
    )
  );
};

export default UserMobile;
