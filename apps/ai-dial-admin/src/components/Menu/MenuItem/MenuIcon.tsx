import { Icon } from '@tabler/icons-react';
import { FC } from 'react';

import { MENU_ICON_GRADIENT_ID, MENU_ICON_PROPS } from '@/src/constants/main-layout';
import { MENU_FILLED_ICONS } from '../menu-item-icons';

interface Props {
  icon: Icon;
  isActive: boolean;
}

const MenuIcon: FC<Props> = ({ icon, isActive }) => {
  const RenderedIcon = (isActive && MENU_FILLED_ICONS.get(icon)) || icon;
  const color = isActive ? `url(#${MENU_ICON_GRADIENT_ID})` : undefined;

  return <RenderedIcon className="shrink-0" {...MENU_ICON_PROPS} color={color} aria-hidden />;
};

export default MenuIcon;
