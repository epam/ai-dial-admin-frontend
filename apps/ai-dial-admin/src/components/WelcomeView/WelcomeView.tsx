'use client';

import { IconDownload, IconExternalLink, IconUpload } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { FC } from 'react';

import Doc from '@/public/images/icons/doc.svg';
import HeaderIcon from '@/public/images/icons/welcome-page/header-icon.svg';
import Button from '@/src/components/Common/Button/Button';
import { MENU_CONFIGURATION } from '@/src/components/Menu/menu-configuration';
import { MenuI18nKey } from '@/src/constants/i18n';
import { BASE_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { getActualMenuItems } from '@/src/utils/env/get-menu-items';
import { WelcomeViewI18nKey } from './i18n';
import MenuGroup from './MenuGroup';
import { useAppContext } from '@/src/context/AppContext';

interface Props {
  docLink?: string;
  dialLink?: string;
  disableMenuItems: string[];
  dialButtonName?: string;
}
const WelcomeView: FC<Props> = ({ docLink, dialLink, disableMenuItems, dialButtonName }) => {
  const router = useRouter();
  const t = useI18n();
  const isTabletScreen = useIsTabletScreen();
  const { embeddedApps } = useAppContext();

  const actualConfig = getActualMenuItems(MENU_CONFIGURATION(40), disableMenuItems, embeddedApps);

  return (
    <div className="flex flex-col w-full h-full overflow-auto">
      <div className="mb-6 flex flex-row justify-between bg-layer-2 p-[32px] relative">
        <div className="flex flex-col w-full lg:w-[55%] z-[10]">
          <h1 className="mb-3">{t(WelcomeViewI18nKey.Title)}</h1>
          <p className="mb-2">{t(WelcomeViewI18nKey.Description)}</p>
          {docLink && (
            <div>
              <Button
                dataTestId="documentation-btn"
                iconBefore={<Doc />}
                cssClass="primary"
                title={t(WelcomeViewI18nKey.ViewDocumentation)}
                onClick={() => {
                  window.open(docLink, '_blank');
                }}
              />
            </div>
          )}
        </div>
        <div className="absolute top-3 right-5 hidden lg:block">
          <HeaderIcon />
        </div>
      </div>
      <div className="mb-6 flex flex-col">
        <h2 className="mb-3">{t(WelcomeViewI18nKey.QuickActions)}</h2>
        <div className="flex flex-row gap-x-3">
          <Button
            iconBefore={<IconDownload {...BASE_ICON_PROPS} widths={24} height={24} />}
            dataTestId="import-btn"
            cssClass="secondary p-4 lg:px-3 lg:py-2 h-[56px] w-[56px] lg:h-[42px] lg:w-auto"
            title={isTabletScreen ? '' : t(MenuI18nKey.ImportConfig)}
            onClick={() => {
              router.push(ApplicationRoute.ImportConfig);
            }}
          />
          <Button
            iconBefore={<IconUpload {...BASE_ICON_PROPS} widths={24} height={24} />}
            dataTestId="export-btn"
            cssClass="secondary p-4 lg:px-3 lg:py-2 h-[56px] w-[56px] lg:h-[42px] lg:w-auto"
            title={isTabletScreen ? '' : t(MenuI18nKey.ExportConfig)}
            onClick={() => {
              router.push(ApplicationRoute.ExportConfig);
            }}
          />
          {dialLink && (
            <Button
              dataTestId="dial-btn"
              iconBefore={<IconExternalLink {...BASE_ICON_PROPS} widths={24} height={24} />}
              cssClass="secondary p-4 lg:px-3 lg:py-2 h-[56px] lg:h-[42px]"
              title={dialButtonName || t(WelcomeViewI18nKey.OpenDial)}
              onClick={() => {
                window.open(dialLink, '_blank');
              }}
            />
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 gap-y-3 flex flex-col w-full">
        <h2>{t(WelcomeViewI18nKey.SiteMap)}</h2>

        <div className="min-h-0 flex flex-col lg:flex-row lg:flex-wrap md:flex-row md:flex-wrap gap-y-3 gap-x-3">
          {actualConfig.map((config) => (
            <MenuGroup menuGroup={config} key={config.key} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeView;
