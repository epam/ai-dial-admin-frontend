import classNames from 'classnames';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';

import '@/src/app/[lang]/global.scss';
import { themesApi, utilityApi } from '@/src/app/api/api';
import Content from '@/src/components/Content/Content';
import Header from '@/src/components/Header/Header';
import Menu from '@/src/components/Menu/Menu';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { AppContextProvider, EmbeddedApp } from '@/src/context/AppContext';
import { FileFolderProvider } from '@/src/context/FileFolderContext';
import { I18nProvider } from '@/src/context/I18nProvider';
import { NextAuthProvider } from '@/src/context/NextAuthProvider';
import { NotificationProvider } from '@/src/context/NotificationContext';
import { PromptFolderProvider } from '@/src/context/PromptFolderContext';
import { RuleFolderProvider } from '@/src/context/RuleFolderContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getMenuItems } from '@/src/utils/env/get-menu-items';
import { AssetsEntityProvider } from '../../context/AssetsContext';

export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  const featureFlags = {
    dashboardEnabled: !process.env.DISABLE_MENU_ITEMS?.toLowerCase().includes('dashboard'),
  };

  const themesConfiguration = await themesApi.getThemesConfiguration();

  const beVersion = await utilityApi.getBeVersion(token);
  const embeddedApps: EmbeddedApp[] = JSON.parse(process.env.EMBEDDED_APPS || '[]');

  return (
    <NextAuthProvider>
      <AppContextProvider
        themeUrl={process.env.THEMES_CONFIG_URL}
        featureFlags={featureFlags}
        embeddedApps={embeddedApps}
      >
        <ThemeProvider themesConfiguration={themesConfiguration} themeImages={process.env.THEMES_CONFIG_IMAGES}>
          <RuleFolderProvider attributes={process.env.PUBLICATION_FILTERS}>
            <AssetsEntityProvider>
              <FileFolderProvider>
                <PromptFolderProvider>
                  <I18nProvider locale={lang}>
                    <NotificationProvider>
                      <div className={classNames('flex flex-col h-full w-full')}>
                        <Header isEnableAuth={isEnableAuth} />
                        <div className="flex-1 min-h-0">
                          <div className="flex flex-row h-full relative">
                            <Menu disableMenuItems={getMenuItems(process.env.DISABLE_MENU_ITEMS)} />
                            <Content isEnableAuth={isEnableAuth} beVersion={beVersion}>
                              {children}
                            </Content>
                          </div>
                        </div>
                      </div>
                    </NotificationProvider>
                  </I18nProvider>
                </PromptFolderProvider>
              </FileFolderProvider>
            </AssetsEntityProvider>
          </RuleFolderProvider>
        </ThemeProvider>
      </AppContextProvider>
    </NextAuthProvider>
  );
}
