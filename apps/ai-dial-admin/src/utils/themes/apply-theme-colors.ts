import { Theme } from '@/src/models/theme';
import { setToLocalStorage } from '@/src/utils/local-storage';
import { fallbackDarkTheme } from './constant';

export const applyThemeColors = (div: HTMLElement, theme?: Theme) => {
  div.removeAttribute('style'); // temporary (dark and white theme colors are not synchronized)

  //TODO remove new color-token filtration when colors will be synchronized
  const excludedKeys = new Set(['bg-layer-sunken', 'bg-layer-base', 'bg-layer-raised']);

  Object.entries(theme ? theme.colors : fallbackDarkTheme).forEach(([key, value]) => {
    //TODO remove new color-token filtration when colors will be synchronized
    if (theme?.id === 'dark' && excludedKeys.has(key)) {
      return;
    }
    div.style.setProperty(`--${key}`, value);
  });
  if (theme) {
    setToLocalStorage('theme', theme.id); // Persist the theme
  }
};
