'use client';

import { Tooltip } from '@epam/ai-dial-ui-kit';
import { Icon } from '@tabler/icons-react';
import classNames from 'classnames';
import Link from 'next/link';
import { FC } from 'react';

import {
  MENU_ENTRY_ACTIVE_CLASS_NAME,
  MENU_ENTRY_CLASS_NAME,
  MENU_ENTRY_INACTIVE_CLASS_NAME,
} from '@/src/components/Menu/MenuItem/constants';
import MenuIcon from '@/src/components/Menu/MenuItem/MenuIcon';

interface Props {
  tooltip: string;
  icon: Icon;
  href: string;
  isActive: boolean;
}

const MenuAction: FC<Props> = ({ tooltip, icon, href, isActive }) => {
  return (
    <Tooltip tooltip={tooltip}>
      <Link
        prefetch={false}
        href={href}
        aria-label={tooltip}
        aria-current={isActive ? 'page' : undefined}
        className={classNames(
          MENU_ENTRY_CLASS_NAME,
          isActive ? MENU_ENTRY_ACTIVE_CLASS_NAME : MENU_ENTRY_INACTIVE_CLASS_NAME,
        )}
      >
        <MenuIcon icon={icon} isActive={isActive} />
      </Link>
    </Tooltip>
  );
};

export default MenuAction;
