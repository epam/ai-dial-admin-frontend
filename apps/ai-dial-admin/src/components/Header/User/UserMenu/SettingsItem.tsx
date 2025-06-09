import { FC } from 'react';

import { BasicI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { IconSettings } from '@tabler/icons-react';

interface Props {
  onClick?: () => void;
}

const SettingsItem: FC<Props> = ({ onClick }) => {
  const t = useI18n();
  return (
    <div className="flex gap-3 items-center cursor-pointer" onClick={onClick}>
      <IconSettings {...BASE_ICON_PROPS} className="text-secondary" />
      <span>{t(BasicI18nKey.Settings)}</span>
    </div>
  );
};

export default SettingsItem;
