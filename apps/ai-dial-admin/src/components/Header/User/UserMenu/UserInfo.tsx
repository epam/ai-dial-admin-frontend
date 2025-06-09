import { Session } from 'next-auth';
import Image from 'next/image';
import { FC } from 'react';

import UserIcon from '@/public/images/icons/user.svg';
import { useI18n } from '@/src/locales/client';

interface Props {
  session: Session | null;
}

const UserInfo: FC<Props> = ({ session }) => {
  const t = useI18n();
  return (
    <div className="flex items-center gap-3 p-4">
      {session?.user?.image ? (
        <Image className="rounded" src={session?.user?.image} width={18} height={18} alt="User avatar" />
      ) : (
        <UserIcon width={18} height={18} />
      )}
      <span className="grow small">{session?.user?.name || t('User')}</span>
    </div>
  );
};

export default UserInfo;
