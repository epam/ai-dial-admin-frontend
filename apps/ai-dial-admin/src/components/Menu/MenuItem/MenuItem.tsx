'use client';

import { FC } from 'react';
import classNames from 'classnames';

import { MenuGroupConfiguration } from '../menu-configuration';
import { useI18n } from '@/src/locales/client';
import { PreviewTag } from '@/src/components/Common/PreviewTag/PreviewTag';

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
    <li className={classNames('flex flex-col', isSidebarOpen && '[&:not(:first-child)]:mt-3')}>
      {isSidebarOpen ? (
        <div className="flex flex-row items-center justify-between px-4 py-1 text-[11px] text-tertiary uppercase tracking-[0.06em] whitespace-nowrap select-none cursor-default leading-4 font-semibold">
          <span className="truncate">{t(config.key) ?? ''}</span>
          {config.isPreview && (
            <div className="ml-2 shrink-0 normal-case tracking-normal">
              <PreviewTag />
            </div>
          )}
        </div>
      ) : (
        hasDivider && <div role="separator" className="w-8 mx-auto my-2 border-t border-tertiary" />
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
