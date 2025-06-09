import { Session } from 'next-auth';
import { FC } from 'react';

import { AuthI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { IconLogout } from '@tabler/icons-react';

interface Props {
  onClick?: () => void;
  session: Session | null;
}

const LogoutItem: FC<Props> = ({ session, onClick }) => {
  const t = useI18n();

  return (
    <div className="flex gap-3 items-center cursor-pointer" onClick={onClick}>
      <IconLogout {...BASE_ICON_PROPS} className="text-secondary" />
      <span>{session ? t(AuthI18nKey.Logout) : t(AuthI18nKey.Login)}</span>
    </div>
  );
};

export default LogoutItem;
