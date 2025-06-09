'use client';

import { FC, useCallback, useState } from 'react';
import classNames from 'classnames';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';

import Tooltip from '@/src/components/Common/Tooltip/Tooltip';
import { useI18n } from '@/src/locales/client';
import { MenuGroupConfiguration } from '../menu-configuration';
import MenuItemContent from './MenuItemContent';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';

interface Props {
  config: MenuGroupConfiguration;
  activeMenuItem: string;
  isOpenByDefault: boolean;
}

const MenuItem: FC<Props> = ({ config, activeMenuItem, isOpenByDefault = false }) => {
  const t = useI18n();
  const { sidebarOpen } = useAppContext();
  const [isOpen, setIsOpen] = useState(isOpenByDefault);

  const onClick = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const menuBlockClassNames = classNames(
    'flex w-full px-3 py-2 flex-row justify-between rounded items-center hover:bg-accent-primary-alpha cursor-pointer group',
  );

  const iconClassNames = isOpenByDefault
    ? 'text-accent-primary'
    : 'text-secondary group-focus-within:text-accent-primary';

  return (
    <li className="flex flex-col">
      <Tooltip
        triggerClassName="flex-1 min-w-0 small-text-semi truncate"
        tooltip={t(config.key) ?? ''}
        placement={'right'}
      >
        <button className={menuBlockClassNames} onClick={onClick} aria-label="button">
          <div className="flex flex-row items-center flex-1 min-w-0">
            <div className={classNames('mr-4', iconClassNames)}>{config.icon}</div>
            <span className="flex-1 min-w-0 text-left truncate"> {t(config.key) ?? ''}</span>
          </div>
          {sidebarOpen && (
            <div className={classNames('ml-4', iconClassNames)}>
              {isOpen ? <IconChevronUp {...BASE_ICON_PROPS} /> : <IconChevronDown {...BASE_ICON_PROPS} />}
            </div>
          )}
        </button>
      </Tooltip>
      {isOpen && !!config.items.length && (
        <div className="flex flex-row w-full relative my-1">
          <div className="bg-layer-4 w-[1px] absolute left-[23px] top-[12px] bottom-[12px]"></div>
          <div className="flex flex-col flex-1 min-w-0 gap-0.5 ">
            {config.items.map((menuItem) => (
              <MenuItemContent key={menuItem.key} menuItem={menuItem} isActive={activeMenuItem === menuItem.href} />
            ))}
          </div>
        </div>
      )}
    </li>
  );
};

export default MenuItem;
