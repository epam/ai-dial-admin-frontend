import { FC, ReactNode } from 'react';
import { render } from '@testing-library/react';
import { AppContextProvider } from '@/src/context/AppContext';
import { NotificationProvider } from '@/src/context/NotificationContext';
import { MockI18nProvider } from '@/src/utils/tests/mock/MockI18nProvider';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { THEME_CONFIG_MOCK, THEME_URL_MOCK } from '@/src/utils/tests/mock/themes.mock';
import { PromptFolderProvider } from '@/src/context/PromptFolderContext';
import { NextAuthProvider } from '@/src/context/NextAuthProvider';
import { FileFolderProvider } from '@/src/context/FileFolderContext';
import { RuleFolderProvider } from '@/src/context/RuleFolderContext';

interface Props {
  children: ReactNode;
}

const Providers: FC<Props> = ({ children }) => {
  return (
    <NextAuthProvider>
      <AppContextProvider themeUrl={THEME_URL_MOCK} featureFlags={{ dashboardEnabled: true }} embeddedApps={[]}>
        <ThemeProvider themesConfiguration={THEME_CONFIG_MOCK}>
          <RuleFolderProvider>
            <FileFolderProvider>
              <PromptFolderProvider>
                <MockI18nProvider>
                  <NotificationProvider>{children}</NotificationProvider>
                </MockI18nProvider>
              </PromptFolderProvider>
            </FileFolderProvider>
          </RuleFolderProvider>
        </ThemeProvider>
      </AppContextProvider>
    </NextAuthProvider>
  );
};

export const renderWithContext = (ui: ReactNode) => {
  return render(ui, { wrapper: Providers });
};
