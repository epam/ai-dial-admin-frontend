import { Session } from 'next-auth';
import { FC } from 'react';
import { IconUser } from '@tabler/icons-react';

import { useI18n } from '@/src/locales/client';

interface Props {
  isMobile?: boolean;
  session: Session | null;
}

const UserInfo: FC<Props> = ({ session, isMobile }) => {
  const t = useI18n();
  const size = isMobile ? 24 : 18;
  return (
    <div className="flex items-center gap-3 p-2 lg:p-4">
      {session?.user?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="rounded" src={session?.user?.image} width={size} height={size} alt="User avatar" />
      ) : (
        <IconUser size={size} />
      )}
      {!isMobile && <span className="grow small">{session?.user?.name || t('User')}</span>}
    </div>
  );
};

export default UserInfo;
