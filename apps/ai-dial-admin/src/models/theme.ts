import { fallbackDarkTheme } from '@/src/utils/themes/constant';

export interface ThemeConfiguration {
  themes: Theme[];
  images: ThemeImages;
}

export interface ThemeImages {
  'default-addon': string;
  'default-model': string;
  favicon: string;
  'admin-logo-light'?: string;
  'admin-logo-dark'?: string;
  'admin-favicon'?: string;
}

export interface Theme {
  id: string;
  displayName: string;
  colors: Record<string, string>;
  'app-logo': string;
}

/** Concrete colors of one theme, for consumers that cannot resolve CSS variables (canvas, Monaco). */
export type ThemePaletteKey = keyof typeof fallbackDarkTheme;
export type ThemePalette = Record<ThemePaletteKey, string>;
