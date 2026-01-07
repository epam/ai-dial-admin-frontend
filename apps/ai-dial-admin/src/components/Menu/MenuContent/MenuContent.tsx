'use client';

import { IconDownload, IconUpload, IconWorldCog } from '@tabler/icons-react';
import classNames from 'classnames';
import { usePathname, useRouter } from 'next/navigation';
import { FC } from 'react';

import { MenuI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { getActualMenuItems } from '@/src/utils/env/get-menu-items';
import { MENU_CONFIGURATION } from '../menu-configuration';
import MenuItem from '../MenuItem/MenuItem';
import MenuAction from './MenuAction';
import MenuActions from './MenuActions';
import { useAppContext } from '@/src/context/AppContext';

interface Props {
  disableMenuItems: string[];
  isSidebarOpen: boolean;
}
const MenuContent: FC<Props> = ({ disableMenuItems, isSidebarOpen }) => {
  const t = useI18n();
  const router = useRouter();
  const { featureFlags } = useAppContext();

  // pathname - /en/models/[id]
  // 0 - empty ''
  // 1 - en
  // 2 - models
  const splittedPathname = usePathname().split('/');
  const pathname = `/${splittedPathname[2]}`;
  const actualConfig = getActualMenuItems(MENU_CONFIGURATION(24, featureFlags), disableMenuItems);

  const activeMenuGroup = actualConfig.find((config) => config.items.some((item) => item.href === pathname));

  const handleImport = () => {
    router.push(ApplicationRoute.ImportConfig);
  };

  const handleExport = () => {
    router.push(ApplicationRoute.ExportConfig);
  };

  const openProperties = () => {
    router.push(ApplicationRoute.SystemProperties);
  };

  const MenuNavigation = ({ showExpanded }: { showExpanded?: boolean }) => (
    <nav className={classNames('p-2 overflow-auto flex-1 min-h-0', !showExpanded && 'mt-[-1px]')}>
      <ul className="divide-primary divide-y">
        {actualConfig.map((config, i) => (
          <MenuItem
            key={`menu-${showExpanded ? 'expanded' : 'default'}-${i}`}
            config={config}
            activeMenuItem={pathname}
            isOpenByDefault={activeMenuGroup?.key === config.key}
            isSidebarOpen={showExpanded || isSidebarOpen}
          />
        ))}
      </ul>
    </nav>
  );

  const MenuActionsBar = () => (
    <div className={classNames(actionsClassName, 'justify-start')}>
      <MenuAction
        tooltip={t(MenuI18nKey.ImportConfig)}
        icon={<IconDownload {...BASE_BUTTON_ICON_PROPS} widths={24} height={24} />}
        onClick={handleImport}
      />
      <MenuAction
        tooltip={t(MenuI18nKey.ExportConfig)}
        icon={<IconUpload {...BASE_BUTTON_ICON_PROPS} widths={24} height={24} />}
        onClick={handleExport}
      />
      <MenuAction
        tooltip={t(MenuI18nKey.SystemProperties)}
        icon={<IconWorldCog {...BASE_BUTTON_ICON_PROPS} widths={24} height={24} />}
        onClick={openProperties}
      />
    </div>
  );

  const actionsClassName = 'px-3 py-2 text-secondary flex flex-row gap-3 items-center';
  const menuClassName = 'flex flex-col divide-tertiary';

  return (
    <div className={classNames(menuClassName, 'h-full relative divide-y group/menu')}>
      <div
        className={classNames(
          menuClassName,
          'absolute left-0 top-0 bottom-0 w-72 bg-layer-3 divide-y z-[51]',
          'opacity-0 invisible',
          !isSidebarOpen && 'group-hover/menu:opacity-100 group-hover/menu:visible hover:opacity-100 hover:visible',
        )}
      >
        <MenuNavigation showExpanded />
        <MenuActionsBar />
      </div>

      <MenuNavigation />

      {isSidebarOpen ? (
        <MenuActionsBar />
      ) : (
        <div className={classNames(actionsClassName, 'justify-center')}>
          <MenuActions onExport={handleExport} onImport={handleImport} onOpenProperties={openProperties} />
        </div>
      )}
    </div>
  );
};

export default MenuContent;
