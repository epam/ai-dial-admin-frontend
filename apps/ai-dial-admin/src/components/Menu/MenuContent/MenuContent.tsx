'use client';

import { IconDownload, IconUpload, IconWorldCog } from '@tabler/icons-react';
import classNames from 'classnames';
import { usePathname } from 'next/navigation';
import { FC } from 'react';

import { MenuI18nKey } from '@/src/constants/i18n';
import { MAIN_MENU_ID } from '@/src/constants/main-layout';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { getIsConfigTransferEnabled } from '@/src/utils/env/get-config-transfer-toggle';
import { getActualMenuItems } from '@/src/utils/env/get-menu-items';
import { MENU_CONFIGURATION } from '../menu-configuration';
import MenuIconGradient from '../MenuIconGradient';
import MenuItem from '../MenuItem/MenuItem';
import MenuAction from './MenuAction';
import { useAppContext } from '@/src/context/AppContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';
import { filterMenuForUnitMode } from '@/src/utils/org-units/menu';

interface Props {
  disableMenuItems: string[];
  isSidebarOpen: boolean;
}
const MenuContent: FC<Props> = ({ disableMenuItems, isSidebarOpen }) => {
  const t = useI18n();
  const { featureFlags, isUnitMode, canReadNamespace } = useAppContext();
  const isConfigTransferEnabled = getIsConfigTransferEnabled(featureFlags);
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  // pathname - /en/models/[id]
  // 0 - empty ''
  // 1 - en
  // 2 - models
  const splittedPathname = usePathname().split('/');
  const pathname = `/${splittedPathname[2]}`;
  const enabledConfig = getActualMenuItems(MENU_CONFIGURATION(16, featureFlags), disableMenuItems);
  const actualConfig = isUnitMode ? filterMenuForUnitMode(enabledConfig, canReadNamespace) : enabledConfig;

  // Config transfer and system properties are admin pages, which a unit user cannot open.
  const showImportExport = isConfigTransferEnabled && !isUnitMode && !(!isSidebarOpen && isReadOnlyAdmin);

  return (
    <div id={MAIN_MENU_ID} className="flex flex-col h-full divide-y divide-tertiary">
      <MenuIconGradient />
      <nav className={classNames('p-2 flex-1 min-h-0', isSidebarOpen ? 'overflow-auto' : 'overflow-hidden')}>
        <ul>
          {actualConfig.map((config, i) => (
            <MenuItem
              key={config.key}
              config={config}
              activeMenuItem={pathname}
              isSidebarOpen={isSidebarOpen}
              hasDivider={i > 0}
            />
          ))}
        </ul>
      </nav>

      <div
        className={classNames(
          'p-2 flex gap-0.5 items-center',
          isSidebarOpen ? 'flex-row justify-start' : 'flex-col justify-center',
        )}
      >
        {showImportExport && (
          <>
            <MenuAction
              tooltip={t(MenuI18nKey.ImportConfig)}
              icon={IconDownload}
              href={ApplicationRoute.ImportConfig}
              isActive={pathname === ApplicationRoute.ImportConfig}
            />
            <MenuAction
              tooltip={t(MenuI18nKey.ExportConfig)}
              icon={IconUpload}
              href={ApplicationRoute.ExportConfig}
              isActive={pathname === ApplicationRoute.ExportConfig}
            />
          </>
        )}
        {!isUnitMode && (
          <MenuAction
            tooltip={t(MenuI18nKey.SystemProperties)}
            icon={IconWorldCog}
            href={ApplicationRoute.SystemProperties}
            isActive={pathname === ApplicationRoute.SystemProperties}
          />
        )}
      </div>
    </div>
  );
};

export default MenuContent;
