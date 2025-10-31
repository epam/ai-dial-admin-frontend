import { Session } from 'next-auth';
import { FC } from 'react';
import { IconUser } from '@tabler/icons-react';

import { useI18n } from '@/src/locales/client';
import classNames from 'classnames';

interface Props {
  isUserIcon?: boolean;
  session: Session | null;
}

const UserInfo: FC<Props> = ({ session, isUserIcon }) => {
  const t = useI18n();
  const size = isUserIcon ? 24 : 18;
  return (
    <div className={classNames('flex items-center gap-3', isUserIcon ? 'p-2' : 'p-4')}>
      {session?.user?.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="rounded" src={session?.user?.image} width={size} height={size} alt="User avatar" />
      ) : (
        <IconUser size={size} />
      )}
      {!isUserIcon && <span className="grow small">{session?.user?.name || t('User')}</span>}
    </div>
  );
};

export default UserInfo;
