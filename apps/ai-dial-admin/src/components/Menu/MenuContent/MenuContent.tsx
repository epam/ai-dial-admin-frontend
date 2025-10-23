'use client';

import { DialConfirmationPopup } from '@epam/ai-dial-ui-kit';
import { IconDownload, IconUpload } from '@tabler/icons-react';
import classNames from 'classnames';
import { usePathname, useRouter } from 'next/navigation';
import { FC, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import { reloadConfig } from '@/src/app/actions';
import { MenuI18nKey, ReloadConfigI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useAppContext } from '@/src/context/AppContext';
import { useNotification } from '@/src/context/NotificationContext';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { getActualMenuItems } from '@/src/utils/env/get-menu-items';
import { getErrorNotification, getSuccessNotification } from '@/src/utils/notification';
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
  const { showNotification } = useNotification();
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [isLoadingReload, setIsLoadingReload] = useState(false);

  const onCloseModal = useCallback(() => {
    setIsOpenModal(false);
  }, [setIsOpenModal]);

  const onConfirmReload = useCallback(() => {
    setIsLoadingReload(true);

    reloadConfig().then((res) => {
      if (res.success) {
        showNotification(
          getSuccessNotification(
            t(ReloadConfigI18nKey.ConfigReloadedTitle),
            t(ReloadConfigI18nKey.ConfigReloadedDescription),
          ),
        );
      } else {
        showNotification(getErrorNotification(res.errorHeader, res.errorMessage));
      }
      setIsLoadingReload(false);
      onCloseModal();
    });
  }, [showNotification, setIsLoadingReload, onCloseModal, t]);

  return (
    <>
      <div className="flex flex-col h-full divide-tertiary divide-y">
        <nav className="p-2 overflow-auto flex-1 min-h-0">
          <ul className="divide-primary divide-y">
            {actualConfig.map((config, i) => (
              <MenuItem
                key={i}
                config={config}
                activeMenuItem={pathname}
                isOpenByDefault={activeMenuGroup?.key === config.key}
                isSidebarOpen={isSidebarOpen}
              />
            ))}
          </ul>
        </nav>

        <div
          className={classNames(
            'px-3 py-2 text-secondary flex flex-row gap-3 items-center',
            isSidebarOpen ? 'justify-start' : 'justify-center',
          )}
        >
          {isSidebarOpen ? (
            <>
              <MenuAction
                tooltip={t(MenuI18nKey.ImportConfig)}
                icon={<IconDownload {...BASE_ICON_PROPS} widths={24} height={24} />}
                onClick={() => {
                  router.push(ApplicationRoute.ImportConfig);
                }}
              />
              <MenuAction
                tooltip={t(MenuI18nKey.ExportConfig)}
                icon={<IconUpload {...BASE_ICON_PROPS} widths={24} height={24} />}
                onClick={() => {
                  router.push(ApplicationRoute.ExportConfig);
                }}
              />
            </>
          ) : (
            <MenuActions
              onExport={() => router.push(ApplicationRoute.ExportConfig)}
              onImport={() => router.push(ApplicationRoute.ImportConfig)}
            />
          )}
        </div>
      </div>
      {isOpenModal &&
        createPortal(
          <DialConfirmationPopup
            open={isOpenModal}
            description={t(ReloadConfigI18nKey.ReloadDescription)}
            title={t(ReloadConfigI18nKey.ReloadTitle)}
            onConfirm={onConfirmReload}
            onClose={onCloseModal}
            isLoading={isLoadingReload}
            confirmLabel={t(ReloadConfigI18nKey.Reload)}
          />,
          document.body,
        )}
    </>
  );
};

export default MenuContent;
