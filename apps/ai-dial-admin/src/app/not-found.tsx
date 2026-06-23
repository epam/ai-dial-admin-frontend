import Page404 from '@/src/components/Page404/Page404';
import { I18nProvider } from '@/src/context/I18nProvider';
import { ThemeProvider } from '@/src/context/ThemeContext';
import { themesApi } from './api/api';

export default async function NotFound() {
  const [themesConfiguration, themesImages] = await Promise.all([
    themesApi.getThemesConfiguration(),
    themesApi.getImages(),
  ]);

  return (
    <I18nProvider locale="en">
      <ThemeProvider themesConfiguration={themesConfiguration} themeImages={themesImages}>
        <Page404 />
      </ThemeProvider>
    </I18nProvider>
  );
}
