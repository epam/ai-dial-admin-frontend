import { DialEllipsisTooltip, DialTooltip } from '@epam/ai-dial-ui-kit';
import classNames from 'classnames';
import Link from 'next/link';
import { FC } from 'react';

import { PreviewTag } from '@/src/components/Common/PreviewTag/PreviewTag';
import { useI18n } from '@/src/locales/client';
import { MenuItem } from '../menu-configuration';
import { MENU_ITEM_ICONS } from '../menu-item-icons';

const MENU_ITEM_ICON_SIZE = 16;

interface Props {
  menuItem: MenuItem;
  isActive: boolean;
  isSidebarOpen: boolean;
}

const MenuItemContent: FC<Props> = ({ menuItem, isActive, isSidebarOpen }) => {
  const t = useI18n();
  const ItemIcon = MENU_ITEM_ICONS[menuItem.key];

  const menuClassName = classNames(
    'group flex flex-row items-center w-full gap-3 px-2 rounded-full cursor-pointer text-sm font-normal leading-5',
    'hover:bg-control-neutral-hover-muted focus-visible:bg-control-neutral-hover-muted',
    isActive
      ? 'bg-control-accent-alpha text-accent hover:bg-control-accent-alpha-hover focus-visible:bg-control-accent-alpha-hover'
      : 'text-primary',
    isSidebarOpen ? 'h-9' : 'justify-center h-8',
  );

  return (
    <DialTooltip
      triggerClassName={classNames('w-full', !isSidebarOpen && 'flex justify-center')}
      tooltip={t(menuItem.key)}
      placement="right"
      hideTooltip={isSidebarOpen}
    >
      <Link
        prefetch={false}
        aria-label={t(menuItem.key)}
        aria-current={isActive ? 'page' : undefined}
        className={menuClassName}
        href={menuItem.href}
      >
        {ItemIcon && <ItemIcon className="shrink-0" size={MENU_ITEM_ICON_SIZE} stroke={1.5} aria-hidden />}
        {isSidebarOpen && <DialEllipsisTooltip className="flex-1 min-w-0" text={t(menuItem.key)} />}
        {menuItem.isPreview && isSidebarOpen ? <PreviewTag /> : null}
      </Link>
    </DialTooltip>
  );
};

export default MenuItemContent;
