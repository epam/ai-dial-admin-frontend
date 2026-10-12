import { Badge, BadgeVariant } from '@epam/ai-dial-ui-kit';
import { FC } from 'react';

import { MenuBadge } from '@/src/components/Menu/menu-configuration';
import { useI18n } from '@/src/locales/client';

import { MENU_BADGES } from './constants';

interface Props {
  badge: MenuBadge;
}

const MenuBadgeTag: FC<Props> = ({ badge }) => {
  const t = useI18n();
  const { labelKey, color } = MENU_BADGES[badge];

  return <Badge label={t(labelKey)} variant={BadgeVariant.Filled} color={color} />;
};

export default MenuBadgeTag;
