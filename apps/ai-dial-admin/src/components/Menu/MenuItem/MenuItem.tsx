'use client';

import { FC, useCallback, useState } from 'react';
import classNames from 'classnames';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { DialTooltip } from '@epam/ai-dial-ui-kit';

import { MenuGroupConfiguration } from '../menu-configuration';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';

import MenuItemContent from './MenuItemContent';

interface Props {
  config: MenuGroupConfiguration;
  activeMenuItem: string;
  isOpenByDefault: boolean;
  isSidebarOpen: boolean;
}

const MenuItem: FC<Props> = ({ config, activeMenuItem, isOpenByDefault = false, isSidebarOpen }) => {
  const t = useI18n();

  const [isOpen, setIsOpen] = useState(isOpenByDefault);

  const onClick = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen]);

  const iconClassName = isOpenByDefault ? 'text-accent-primary' : 'text-secondary';

  return (
    <li className="flex flex-col">
      <DialTooltip triggerClassName="small-text-semi" tooltip={t(config.key) ?? ''} placement="right">
        <button
          className="flex w-full px-3 py-2 flex-row justify-between rounded items-center hover:bg-accent-primary-alpha cursor-pointer group"
          onClick={onClick}
          aria-label="button"
        >
          <div className="flex flex-row items-center flex-1 min-w-0">
            <div className={classNames('mr-4', iconClassName)}>{config.icon}</div>
            <span className="text-left truncate text-primary"> {t(config.key) ?? ''}</span>
          </div>
          {isSidebarOpen && (
            <div className={classNames('ml-4', iconClassName)}>
              {isOpen ? <IconChevronUp {...BASE_BUTTON_ICON_PROPS} /> : <IconChevronDown {...BASE_BUTTON_ICON_PROPS} />}
            </div>
          )}
        </button>
      </DialTooltip>
      {isOpen && !!config.items.length && (
        <div className="flex flex-row w-full relative my-1">
          <div className="bg-layer-4 w-[px] absolute left-[23px] inset-y-[12px]"></div>
          <div className="flex flex-col flex-1 min-w-0 gap-0.5 ">
            {config.items.map((menuItem) => (
              <MenuItemContent
                key={menuItem.key}
                menuItem={menuItem}
                isActive={activeMenuItem === menuItem.href}
                isSidebarOpen={isSidebarOpen}
              />
            ))}
          </div>
        </div>
      )}
    </li>
  );
};

export default MenuItem;
