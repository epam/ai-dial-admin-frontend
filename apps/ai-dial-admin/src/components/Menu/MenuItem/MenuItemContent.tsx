import classNames from 'classnames';
import { FC } from 'react';
import Link from 'next/link';
import { DialEllipsisTooltip, DialTooltip } from '@epam/ai-dial-ui-kit';

import { useI18n } from '@/src/locales/client';
import { MenuItem } from '../menu-configuration';

interface Props {
  menuItem: MenuItem;
  isActive: boolean;
  isSidebarOpen: boolean;
}

const MenuItemContent: FC<Props> = ({ menuItem, isActive, isSidebarOpen }) => {
  const t = useI18n();
  const menuClassName = classNames(
    'group p-2 text-primary rounded cursor-pointer hover:bg-accent-primary-alpha focus:bg-accent-primary-alpha small-150 md:tiny',
    'flex flex-row items-center border-l-2 h-[40px] md:h-[32px]',
    isActive ? 'bg-accent-primary-alpha border-l-accent-primary' : 'border-l-transparent',
  );

  const menuCircleClassName = classNames(
    'w-[8px] h-[8px] mx-[10px] rounded-full z-50',
    isActive ? 'bg-accent-primary' : 'bg-controls-disable invisible group-focus-within:visible group-hover:visible',
    isSidebarOpen ? '' : 'my-[3px]',
  );

  return (
    <DialTooltip
      triggerClassName="small-text-semi"
      tooltip={t(menuItem.key)}
      placement={'right'}
      hideTooltip={isSidebarOpen}
    >
      <Link prefetch={false} aria-label={t(menuItem.key)} className={menuClassName} href={menuItem.href}>
        <div className={menuCircleClassName}></div>
        {isSidebarOpen && <DialEllipsisTooltip className="ml-4" text={t(menuItem.key)} />}
      </Link>
    </DialTooltip>
  );
};

export default MenuItemContent;
