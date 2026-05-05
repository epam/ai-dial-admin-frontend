import { ThemeConfiguration } from '@/src/models/theme';
import { DEFAULT_THEME } from '@/src/constants/theme';

export const getLogoPath = (themesConfiguration: ThemeConfiguration, themeId: string): string => {
  const theme = themesConfiguration?.themes.find((t) => t.id === themeId);
  const fallbackLogo = theme?.['app-logo'] || '';

  if (themesConfiguration?.images['admin-logo-light'] && themesConfiguration?.images['admin-logo-dark']) {
    return themeId === DEFAULT_THEME
      ? themesConfiguration?.images['admin-logo-dark']
      : themesConfiguration?.images['admin-logo-light'];
  }

  return fallbackLogo;
};
