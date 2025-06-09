import { Theme } from '@/src/models/theme';
import { setToLocalStorage } from '@/src/utils/local-storage';

export const applyThemeColors = (div: HTMLElement, theme?: Theme) => {
  if (theme) {
    const themeColors = theme.colors;

    Object.entries(themeColors).forEach(([key, value]) => {
      div.style.setProperty(`--${key}`, value);
    });

    setToLocalStorage('theme', theme.id); // Persist the theme
  }
};
