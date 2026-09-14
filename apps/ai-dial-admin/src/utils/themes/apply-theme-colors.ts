import { Theme } from '@/src/models/theme';
import { setToLocalStorage } from '@/src/utils/local-storage';
import { fallbackDarkTheme } from './constant';

export const applyThemeColors = (div: HTMLElement, theme?: Theme) => {
  div.removeAttribute('style'); // temporary (dark and white theme colors are not synchronized)

  Object.entries(theme ? theme.colors : fallbackDarkTheme).forEach(([key, value]) => {
    div.style.setProperty(`--${key}`, value);
  });
  if (theme) {
    setToLocalStorage('theme', theme.id); // Persist the theme
  }
};
