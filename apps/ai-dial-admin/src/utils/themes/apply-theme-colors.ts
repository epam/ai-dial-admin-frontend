import { Theme } from '@/src/models/theme';
import { setToLocalStorage } from '@/src/utils/local-storage';
import { fallbackDarkTheme, newTokensMap } from './constant';

export const applyThemeColors = (div: HTMLElement, theme?: Theme) => {
  div.removeAttribute('style'); // temporary (dark and white theme colors are not synchronized)

  const colors: Record<string, string> = theme ? theme.colors : fallbackDarkTheme;

  Object.entries(colors).forEach(([key, value]) => {
    const newToken = newTokensMap[key as keyof typeof newTokensMap];
    div.style.setProperty(`--${key}`, (newToken && colors[newToken]) ?? value);
  });
  if (theme) {
    setToLocalStorage('theme', theme.id); // Persist the theme
  }
};
