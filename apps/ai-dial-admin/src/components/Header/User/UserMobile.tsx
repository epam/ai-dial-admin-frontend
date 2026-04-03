import { FC } from 'react';

import { useAppContext } from '@/src/context/AppContext';
import { DialEllipsisTooltip } from '@epam/ai-dial-ui-kit';
import { useLogout } from '@/src/hooks/use-logout';
import { UserIcon } from './UserMenu/UserIcon';
import UserMenu from './UserMenu/UserMenu';

interface Props {
  isEnableAuth: boolean;
}

const UserMobile: FC<Props> = ({ isEnableAuth }) => {
  const { userMenuOpen } = useAppContext();
  const { session } = useLogout();

  return (
    userMenuOpen && (
      <div className="lg:hidden absolute right-0 inset-y-0 w-[260px] z-50 bg-layer-3">
        <div className="flex h-[59px] items-center gap-3 px-4 border-b border-tertiary">
          <UserIcon className="mx-2" />

          <DialEllipsisTooltip
            contentClassName="grow"
            text={<span data-qa="username">{session?.user?.name ?? ''}</span>}
          />
        </div>
        <UserMenu isMobile={true} isEnableAuth={isEnableAuth} />
      </div>
    )
  );
};

export default UserMobile;
