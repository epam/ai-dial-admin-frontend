import { themesApi } from '@/src/app/api/api';
import { I18nProvider } from '@/src/context/I18nProvider';
import { ThemeProvider } from '@/src/context/ThemeContext';
import Page404 from './Page404';

export default async function Page404Wrapper() {
  const themesConfiguration = await themesApi.getThemesConfiguration();
  const themeImages = await themesApi.getImages();

  return (
    <I18nProvider locale="en">
      <ThemeProvider themesConfiguration={themesConfiguration} themeImages={themeImages}>
        <Page404 />
      </ThemeProvider>
    </I18nProvider>
  );
}
