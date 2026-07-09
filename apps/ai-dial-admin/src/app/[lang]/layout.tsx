import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import '@epam/ai-dial-ui-kit/styles.css';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import '@/src/app/[lang]/global.scss';

import { telemetryApi, themesApi, utilityApi } from '@/src/app/api/api';
import Content from '@/src/components/Content/Content';
import Header from '@/src/components/Header/Header';
import Menu from '@/src/components/Menu/Menu';
import { SIGN_IN_LINK } from '@/src/constants/auth';
import { AppContextProvider } from '@/src/context/AppContext';
import { AppsFolderProvider } from '@/src/context/assets/AppsFolderContext';
import { PromptFolderProvider } from '@/src/context/assets/PromptFolderContext';
import { I18nProvider } from '@/src/context/I18nProvider';
import { NextAuthProvider } from '@/src/context/NextAuthProvider';
import { NotificationProvider } from '@/src/context/NotificationContext';
import { RuleFolderProvider } from '@/src/context/RuleFolderContext';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { ResourcesDefaults } from '@/src/models/deployments/containers';
import { FeatureFlags } from '@/src/models/feature-flags';
import { getUserToken } from '@/src/utils/auth/auth-request';
import { getIsInvalidSession } from '@/src/utils/auth/is-valid-session';
import { getIsEnableAuthToggle } from '@/src/utils/env/get-auth-toggle';
import { getMenuItems } from '@/src/utils/env/get-menu-items';
import { extractTelemetryMaxRangeMs } from '@/src/utils/telemetry';
import { isValueTruthy } from '@/src/utils/types';
import { normalizeUrl } from '@/src/utils/url';
import { FileFolderProvider } from '@/src/context/assets/FileFolderContext';
import { ToolsetFolderProvider } from '@/src/context/assets/ToolsetsFolderContext';
import { ConversationFolderProvider } from '@/src/context/assets/ConversationsFolderContext';

export default async function Layout({ children, params }: { children: ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const isEnableAuth = getIsEnableAuthToggle();
  const token = await getUserToken(isEnableAuth, headers(), cookies());
  const isInvalidSession = await getIsInvalidSession(isEnableAuth, token);

  if (isInvalidSession) {
    return redirect(SIGN_IN_LINK);
  }

  const featureFlags: FeatureFlags = {
    dashboardEnabled: !process.env.DISABLE_MENU_ITEMS?.toLowerCase().includes('dashboard'),
    deploymentsEnabled: isValueTruthy(process.env.DEPLOYMENTS_ENABLED),
    evaluationEnabled: process.env.DIAL_EVAL_API_URL != null,
    mcpRegistryEnabled: isValueTruthy(process.env.MCP_REGISTRY_ENABLED),
    nimEnabled: isValueTruthy(process.env.NIM_ENABLED),
    hfEnabled: isValueTruthy(process.env.HF_ENABLED),
    runsCompareEnabled: isValueTruthy(process.env.RUNS_COMPARE_ENABLED),
    analyticsEnabled: isValueTruthy(process.env.ANALYTICS_ENABLED),
  };

  const themesConfiguration = await themesApi.getThemesConfiguration();
  const themesImages = await themesApi.getImages();

  const beVersion = await utilityApi.getBeVersion(token);
  const telemetryMaxRangeMs = extractTelemetryMaxRangeMs(await telemetryApi.getDatasets(token));

  return (
    <I18nProvider locale={lang}>
      <NextAuthProvider>
        <AppContextProvider
          themeUrl={normalizeUrl(process.env.THEMES_CONFIG_URL)}
          featureFlags={featureFlags}
          disableDeploymentsJSONEditor={isValueTruthy(process.env.DEPLOYMENTS_DISABLE_JSON_EDITOR)}
          resourcesDefaults={JSON.parse(process.env.DEPLOYMENTS_RESOURCES_DEFAULTS || '{}') as ResourcesDefaults}
          telemetryMaxRangeMs={telemetryMaxRangeMs}
          codeAppEditorUrl={process.env.CODE_APP_EDITOR_URL}
          userInfo={(await utilityApi.getUserInfo(token)).response?.userInfo}
        >
          <ThemeProvider themesConfiguration={themesConfiguration} themeImages={themesImages}>
            <RuleFolderProvider attributes={process.env.PUBLICATION_FILTERS || 'title,role,dial_roles'}>
              <AppsFolderProvider>
                <PromptFolderProvider>
                  <ToolsetFolderProvider>
                    <FileFolderProvider>
                      <ConversationFolderProvider>
                        <NotificationProvider>
                          <div className="flex flex-col size-full">
                            <Header
                              isEnableAuth={isEnableAuth}
                              docLink={normalizeUrl(process.env.DIAL_ADMIN_DOCUMENTATION)}
                            />
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
                      </ConversationFolderProvider>
                    </FileFolderProvider>
                  </ToolsetFolderProvider>
                </PromptFolderProvider>
              </AppsFolderProvider>
            </RuleFolderProvider>
          </ThemeProvider>
        </AppContextProvider>
      </NextAuthProvider>
    </I18nProvider>
  );
}
