import { ThemeConfiguration } from '@/src/models/theme';
import { EDITOR_THEMES } from '@/src/types/editor';

export const getLogoPath = (themesConfiguration: ThemeConfiguration, themeId?: string): string => {
  const theme = themesConfiguration?.themes.find((t) => t.id === themeId);
  const fallbackLogo = theme?.['app-logo'] || '';

  if (themesConfiguration?.images['admin-logo-light'] && themesConfiguration?.images['admin-logo-dark']) {
    return themeId === EDITOR_THEMES.dark
      ? themesConfiguration?.images['admin-logo-dark']
      : themesConfiguration?.images['admin-logo-light'];
  }

  return fallbackLogo;
};
