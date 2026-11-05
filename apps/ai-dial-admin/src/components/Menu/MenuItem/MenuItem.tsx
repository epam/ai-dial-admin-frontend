'use client';

import { FC } from 'react';

import { MenuGroupConfiguration } from '../menu-configuration';
import { useI18n } from '@/src/locales/client';

import MenuBadgeTag from './MenuBadgeTag';
import MenuItemContent from './MenuItemContent';

interface Props {
  config: MenuGroupConfiguration;
  activeMenuItem: string;
  isSidebarOpen: boolean;
  hasDivider?: boolean;
}

const MenuItem: FC<Props> = ({ config, activeMenuItem, isSidebarOpen, hasDivider }) => {
  const t = useI18n();

  return (
    <li className="flex flex-col [&:not(:first-child)]:mt-3">
      {isSidebarOpen ? (
        <div className="flex h-6 flex-row items-center justify-between px-3 text-[10px] text-tertiary uppercase tracking-[0.06em] whitespace-nowrap select-none cursor-default leading-3 font-semibold">
          <span className="truncate">{t(config.key) ?? ''}</span>
          {config.badge && (
            <div className="ml-2 shrink-0 normal-case tracking-normal">
              <MenuBadgeTag badge={config.badge} />
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-6 items-center justify-center">
          {hasDivider && <div role="separator" className="w-6 border-t border-tertiary" />}
        </div>
      )}
      {!!config.items.length && (
        <ul aria-label={t(config.key)} className="flex flex-col gap-px pt-0.5">
          {config.items.map((menuItem) => (
            <li key={menuItem.key}>
              <MenuItemContent
                menuItem={menuItem}
                isActive={activeMenuItem === menuItem.href}
                isSidebarOpen={isSidebarOpen}
              />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

export default MenuItem;
