'use client';

import { IconDownload, IconUpload } from '@tabler/icons-react';
import classNames from 'classnames';
import { usePathname, useRouter } from 'next/navigation';
import { FC, useState } from 'react';

import { MenuI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { getActualMenuItems } from '@/src/utils/env/get-menu-items';
import { MENU_CONFIGURATION } from '../menu-configuration';
import MenuItem from '../MenuItem/MenuItem';
import MenuAction from './MenuAction';
import MenuActions from './MenuActions';

interface Props {
  disableMenuItems: string[];
  isSidebarOpen: boolean;
}
const MenuContent: FC<Props> = ({ disableMenuItems, isSidebarOpen }) => {
  const t = useI18n();
  const router = useRouter();
  const { embeddedApps } = useAppContext();

  // pathname - /en/models/[id]
  // 0 - empty ''
  // 1 - en
  // 2 - models
  const splittedPathname = usePathname().split('/');
  const pathname = `/${splittedPathname[2]}`;
  const actualConfig = getActualMenuItems(MENU_CONFIGURATION(24), disableMenuItems, embeddedApps);

  const activeMenuGroup = actualConfig.find((config) => config.items.some((item) => item.href === pathname));

  const [hovered, setHovered] = useState(false);

  const handleImport = () => {
    router.push(ApplicationRoute.ImportConfig);
  };

  const handleExport = () => {
    router.push(ApplicationRoute.ExportConfig);
  };

  const MenuNavigation = ({ showExpanded }: { showExpanded?: boolean }) => (
    <nav className={classNames('p-2', showExpanded ? 'flex-1' : 'overflow-auto flex-1 min-h-0')}>
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
    <div className={classNames(actionsClassNames, 'justify-start')}>
      <MenuAction
        tooltip={t(MenuI18nKey.ImportConfig)}
        icon={<IconDownload {...BASE_ICON_PROPS} widths={24} height={24} />}
        onClick={handleImport}
      />
      <MenuAction
        tooltip={t(MenuI18nKey.ExportConfig)}
        icon={<IconUpload {...BASE_ICON_PROPS} widths={24} height={24} />}
        onClick={handleExport}
      />
    </div>
  );

  const actionsClassNames = 'px-3 py-2 text-secondary flex flex-row gap-3 items-center';
  const menuClassNames = 'flex flex-col divide-tertiary divide-y';

  return (
    <div
      className={classNames(menuClassNames, 'h-full ')}
      onMouseEnter={() => !isSidebarOpen && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <MenuNavigation />

      {isSidebarOpen ? (
        <MenuActionsBar />
      ) : hovered ? (
        <div
          className={classNames(menuClassNames, 'absolute left-0 top-0 bottom-0 w-72 bg-layer-3 ')}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <MenuNavigation showExpanded />
          <MenuActionsBar />
        </div>
      ) : (
        <div className={classNames(actionsClassNames, 'justify-center')}>
          <MenuActions onExport={handleExport} onImport={handleImport} />
        </div>
      )}
    </div>
  );
};

export default MenuContent;
