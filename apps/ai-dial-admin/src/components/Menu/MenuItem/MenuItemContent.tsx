import classNames from 'classnames';
import { FC } from 'react';

import { useI18n } from '@/src/locales/client';
import { MenuItem } from '../menu-configuration';
import Link from 'next/link';
import { useAppContext } from '@/src/context/AppContext';
import Tooltip from '@/src/components/Common/Tooltip/Tooltip';

interface Props {
  menuItem: MenuItem;
  isActive: boolean;
}

const MenuItemContent: FC<Props> = ({ menuItem, isActive }) => {
  const t = useI18n();
  const { sidebarOpen } = useAppContext();
  const menuClassNames = classNames(
    'group p-2 text-primary rounded cursor-pointer hover:bg-accent-primary-alpha focus:bg-accent-primary-alpha small-150 md:tiny',
    'flex flex-row items-center border-l-2 focus-within:outline outline-offset-[-1px] h-[40px] md:h-[32px]',
    isActive ? 'bg-accent-primary-alpha border-l-accent-primary' : 'border-l-transparent',
  );

  const menuCircleClassNames = classNames(
    'w-[8px] h-[8px] mx-[10px] rounded-full z-50',
    isActive ? 'bg-accent-primary' : 'bg-controls-disable invisible group-focus-within:visible group-hover:visible',
    sidebarOpen ? '' : 'my-[3px]',
  );

  return (
    <Tooltip
      triggerClassName="flex-1 min-w-0 small-text-semi truncate"
      tooltip={t(menuItem.key)}
      placement={'right'}
      hideTooltip={sidebarOpen}
    >
      <Link aria-label={t(menuItem.key)} className={menuClassNames} href={menuItem.href}>
        <div className={menuCircleClassNames}></div>
        {sidebarOpen && <span className="ml-4">{t(menuItem.key)}</span>}
      </Link>
    </Tooltip>
  );
};

export default MenuItemContent;
