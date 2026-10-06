import { ThemePalette } from '@/src/models/theme';
import { EDITOR_THEMES } from '@/src/types/editor';
import { fallbackDarkTheme, fallbackLightTheme } from '@/src/utils/themes/constant';

// A custom theme from the themes service has no palette of its own here and gets the dark one, the
// app's default.
export const getThemePalette = (themeId?: string): ThemePalette =>
  themeId === EDITOR_THEMES.light ? fallbackLightTheme : fallbackDarkTheme;
