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
      <div className="lg:hidden absolute right-0 inset-y-0 w-[260px] z-50 bg-layer-3">
        <UserMenu isMobile={true} isEnableAuth={isEnableAuth} />
      </div>
    )
  );
};

export default UserMobile;
