'use client';

import { IconDownload, IconUpload, IconWorldCog } from '@tabler/icons-react';
import classNames from 'classnames';
import { usePathname, useRouter } from 'next/navigation';
import { FC } from 'react';

import { MenuI18nKey } from '@/src/constants/i18n';
import { MENU_ACTION_ICON_PROPS } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { getIsConfigTransferEnabled } from '@/src/utils/env/get-config-transfer-toggle';
import { getActualMenuItems } from '@/src/utils/env/get-menu-items';
import { MENU_CONFIGURATION } from '../menu-configuration';
import MenuItem from '../MenuItem/MenuItem';
import MenuAction from './MenuAction';
import { useAppContext } from '@/src/context/AppContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';

interface Props {
  disableMenuItems: string[];
  isSidebarOpen: boolean;
}
const MenuContent: FC<Props> = ({ disableMenuItems, isSidebarOpen }) => {
  const t = useI18n();
  const router = useRouter();
  const { featureFlags } = useAppContext();
  const isConfigTransferEnabled = getIsConfigTransferEnabled(featureFlags);
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  // pathname - /en/models/[id]
  // 0 - empty ''
  // 1 - en
  // 2 - models
  const splittedPathname = usePathname().split('/');
  const pathname = `/${splittedPathname[2]}`;
  const actualConfig = getActualMenuItems(MENU_CONFIGURATION(16, featureFlags), disableMenuItems);

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
    <nav
      className={classNames(
        'p-2 flex-1 min-h-0',
        showExpanded || isSidebarOpen ? 'overflow-auto' : 'overflow-hidden',
        !showExpanded && 'mt-[-1px]',
      )}
    >
      <ul>
        {actualConfig.map((config, i) => (
          <MenuItem
            key={`menu-${showExpanded ? 'expanded' : 'default'}-${i}`}
            config={config}
            activeMenuItem={pathname}
            isSidebarOpen={showExpanded || isSidebarOpen}
            hasDivider={i > 0}
          />
        ))}
      </ul>
    </nav>
  );

  const showImportExport = (isColumn?: boolean) => isConfigTransferEnabled && !(isColumn && isReadOnlyAdmin);

  const MenuActionsBar = ({ isColumn }: { isColumn?: boolean }) => (
    <div className={classNames(actionsClassName, isColumn ? 'flex-col justify-center' : 'flex-row justify-start')}>
      {showImportExport(isColumn) && (
        <>
          <MenuAction
            tooltip={t(MenuI18nKey.ImportConfig)}
            icon={<IconDownload {...MENU_ACTION_ICON_PROPS} />}
            onClick={handleImport}
          />
          <MenuAction
            tooltip={t(MenuI18nKey.ExportConfig)}
            icon={<IconUpload {...MENU_ACTION_ICON_PROPS} />}
            onClick={handleExport}
          />
        </>
      )}
      <MenuAction
        tooltip={t(MenuI18nKey.SystemProperties)}
        icon={<IconWorldCog {...MENU_ACTION_ICON_PROPS} />}
        onClick={openProperties}
      />
    </div>
  );

  const actionsClassName = 'px-2 py-2 text-secondary flex gap-1 items-center';
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

      {isSidebarOpen ? <MenuActionsBar /> : <MenuActionsBar isColumn />}
    </div>
  );
};

export default MenuContent;
