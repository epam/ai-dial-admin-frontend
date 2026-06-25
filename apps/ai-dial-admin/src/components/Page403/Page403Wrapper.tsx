import { ThemeConfiguration } from '@/src/models/theme';
import { I18nProvider } from '@/src/context/I18nProvider';
import { ThemeProvider } from '@/src/context/ThemeContext';
import Page403 from './Page403';

interface Props {
  lang: string;
  themesConfiguration: ThemeConfiguration | null;
  themeImages?: { name: string }[] | null;
}

export default function Page403Wrapper({ lang, themesConfiguration, themeImages }: Props) {
  return (
    <I18nProvider locale={lang}>
      <ThemeProvider themesConfiguration={themesConfiguration} themeImages={themeImages}>
        <Page403 />
      </ThemeProvider>
    </I18nProvider>
  );
}
