'use client';

import { IconDownload, IconFileDescription, IconExternalLink, IconUpload, IconWorldCog } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { FC } from 'react';
import { DialNeutralButton, DialPrimaryButton } from '@epam/ai-dial-ui-kit';

import ReadOnlyAdminBanner from '@/src/components/Common/ReadOnlyBanner/ReadOnlyBanner';
import HeaderIcon from '@/public/images/icons/welcome-page/header-icon.svg';
import { MENU_CONFIGURATION } from '@/src/components/Menu/menu-configuration';
import { MenuI18nKey } from '@/src/constants/i18n';
import { BASE_BUTTON_ICON_PROPS } from '@/src/constants/main-layout';
import { useIsTabletScreen } from '@/src/hooks/use-is-tablet-screen';
import { useI18n } from '@/src/locales/client';
import { ApplicationRoute } from '@/src/types/routes';
import { getActualMenuItems } from '@/src/utils/env/get-menu-items';
import { WelcomeViewI18nKey } from './i18n';
import MenuGroup from './MenuGroup';
import { useAppContext } from '@/src/context/AppContext';
import { useIsReadOnlyAdmin } from '@/src/hooks/use-is-read-only-admin';

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
  const { featureFlags } = useAppContext();
  const isReadOnlyAdmin = useIsReadOnlyAdmin();

  const actualConfig = getActualMenuItems(MENU_CONFIGURATION(40, featureFlags), disableMenuItems);

  return (
    <div className="flex flex-col size-full overflow-auto sm:px-2">
      {isReadOnlyAdmin && <ReadOnlyAdminBanner />}
      <div className="mb-6 flex flex-row justify-between bg-layer-2 p-[32px] relative">
        <div className="flex flex-col w-full xl:w-[55%] xl:z-10">
          <h1 className="mb-3">{t(WelcomeViewI18nKey.Title)}</h1>
          <p className="mb-2">{t(WelcomeViewI18nKey.Description)}</p>
          {docLink && (
            <div>
              <DialPrimaryButton
                iconBefore={<IconFileDescription {...BASE_BUTTON_ICON_PROPS} />}
                label={t(WelcomeViewI18nKey.ViewDocumentation)}
                onClick={() => {
                  window.open(docLink, '_blank');
                }}
              />
            </div>
          )}
        </div>
        <div className="absolute top-3 right-5 hidden xl:block">
          <HeaderIcon />
        </div>
      </div>
      <div className="mb-6 flex flex-col">
        <h2 className="mb-3">{t(WelcomeViewI18nKey.QuickActions)}</h2>
        <div className="flex flex-row gap-x-3">
          {!isReadOnlyAdmin && (
            <>
              <DialNeutralButton
                iconBefore={<IconDownload {...BASE_BUTTON_ICON_PROPS} widths={24} height={24} />}
                className="p-4 lg:px-3 lg:py-2 size-[56px] lg:h-[42px] lg:w-auto"
                label={isTabletScreen ? '' : t(MenuI18nKey.ImportConfig)}
                onClick={() => {
                  router.push(ApplicationRoute.ImportConfig);
                }}
              />
              <DialNeutralButton
                iconBefore={<IconUpload {...BASE_BUTTON_ICON_PROPS} widths={24} height={24} />}
                className="p-4 lg:px-3 lg:py-2 size-[56px] lg:h-[42px] lg:w-auto"
                label={isTabletScreen ? '' : t(MenuI18nKey.ExportConfig)}
                onClick={() => {
                  router.push(ApplicationRoute.ExportConfig);
                }}
              />
            </>
          )}
          <DialNeutralButton
            iconBefore={<IconWorldCog {...BASE_BUTTON_ICON_PROPS} widths={24} height={24} />}
            className="p-4 lg:px-3 lg:py-2 size-[56px] lg:h-[42px] lg:w-auto"
            label={isTabletScreen ? '' : t(MenuI18nKey.SystemProperties)}
            onClick={() => {
              router.push(ApplicationRoute.SystemProperties);
            }}
          />
          {dialLink && (
            <DialNeutralButton
              iconBefore={<IconExternalLink {...BASE_BUTTON_ICON_PROPS} widths={24} height={24} />}
              className="p-4 lg:px-3 lg:py-2 h-[56px] lg:h-[42px]"
              label={dialButtonName || t(WelcomeViewI18nKey.OpenDial)}
              onClick={() => {
                window.open(dialLink, '_blank');
              }}
            />
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 gap-y-3 flex flex-col w-full">
        <h2>{t(WelcomeViewI18nKey.SiteMap)}</h2>

        <div className="min-h-0 flex flex-col lg:flex-row lg:flex-wrap md:flex-row md:flex-wrap gap-3">
          {actualConfig.map((config) => (
            <MenuGroup menuGroup={config} key={config.key} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeView;
