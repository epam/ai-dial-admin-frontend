import { EllipsisTooltip, Tooltip, TooltipPlacement } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import Link from 'next/link';
import { FC, useEffect, useRef } from 'react';

import { useI18n } from '@/src/locales/client';
import { MenuItem } from '../menu-configuration';
import { MENU_ITEM_ICONS } from '../menu-item-icons';
import { MENU_ENTRY_ACTIVE_CLASS_NAME, MENU_ENTRY_CLASS_NAME, MENU_ENTRY_INACTIVE_CLASS_NAME } from './constants';
import MenuBadgeTag from './MenuBadgeTag';
import MenuIcon from './MenuIcon';

interface Props {
  menuItem: MenuItem;
  isActive: boolean;
  isSidebarOpen: boolean;
}

const MenuItemContent: FC<Props> = ({ menuItem, isActive, isSidebarOpen }) => {
  const t = useI18n();
  const ItemIcon = MENU_ITEM_ICONS[menuItem.key];
  const linkRef = useRef<HTMLAnchorElement>(null);

  // The menu navigation remounts on route change, so it must bring its active item into view.
  useEffect(() => {
    if (isActive) {
      linkRef.current?.scrollIntoView?.({ block: 'center' });
    }
  }, [isActive]);

  const menuClassName = classNames(
    MENU_ENTRY_CLASS_NAME,
    'group w-full gap-3',
    isActive ? MENU_ENTRY_ACTIVE_CLASS_NAME : MENU_ENTRY_INACTIVE_CLASS_NAME,
    !isSidebarOpen && 'justify-center',
  );

  return (
    <Tooltip
      triggerClassName={classNames('w-full', !isSidebarOpen && 'flex justify-center')}
      tooltip={t(menuItem.key)}
      placement={TooltipPlacement.Right}
      hideTooltip={isSidebarOpen}
    >
      <Link
        ref={linkRef}
        prefetch={false}
        aria-label={t(menuItem.key)}
        aria-current={isActive ? 'page' : undefined}
        className={menuClassName}
        href={menuItem.href}
      >
        {ItemIcon && <MenuIcon icon={ItemIcon} isActive={isActive} />}
        {isSidebarOpen && <EllipsisTooltip className="flex-1 min-w-0" text={t(menuItem.key)} />}
        {menuItem.badge && isSidebarOpen ? <MenuBadgeTag badge={menuItem.badge} /> : null}
      </Link>
    </Tooltip>
  );
};

export default MenuItemContent;
