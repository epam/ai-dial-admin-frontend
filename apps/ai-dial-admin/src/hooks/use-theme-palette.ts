import { useTheme } from '@/src/context/ThemeContext';
import { ThemePalette } from '@/src/models/theme';
import { getThemePalette } from '@/src/utils/themes/get-theme-palette';

export const useThemePalette = (): ThemePalette => {
  const { currentTheme } = useTheme();
  return getThemePalette(currentTheme);
};
