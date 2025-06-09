'use client';
import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { Theme, ThemeConfiguration, ThemeImages } from '@/src/models/theme';
import { getFromLocalStorage } from '@/src/utils/local-storage';
import { applyThemeColors } from '@/src/utils/themes/apply-theme-colors';

interface ThemeContextType {
  currentTheme: string;
  currentThemeLogo?: string;
  themesImageConfig?: ThemeImages;
  themes?: Theme[];
  images: string[] | null;
  setTheme: (themeId: string) => void;
}

const DEFAULT_THEME = 'dark';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({
  children,
  themesConfiguration,
  themeImages,
}: {
  children: ReactNode;
  themesConfiguration: ThemeConfiguration | null;
  themeImages?: string;
}) => {
  const [currentThemeId, setCurrentThemeId] = useState<string>(DEFAULT_THEME);
  const [currentThemeLogo, setCurrentThemeLogo] = useState<string | undefined>(void 0);

  const images = themeImages?.split(',').map((name) => name.trim()) || null;

  useEffect(() => {
    const storedTheme = typeof window !== 'undefined' ? getFromLocalStorage('theme') : null;
    const configuredTheme = storedTheme || themesConfiguration?.themes?.[0].id;
    if (configuredTheme) {
      setCurrentThemeId(configuredTheme);
    }
  }, [themesConfiguration]);

  useEffect(() => {
    if (currentThemeId && themesConfiguration && themesConfiguration.themes?.length > 0) {
      const theme = themesConfiguration.themes.find((t) => t.id === currentThemeId);
      const root = document.documentElement;
      applyThemeColors(root, theme);
      setCurrentThemeLogo(theme?.['app-logo']);
    }
  }, [currentThemeId, themesConfiguration]);

  const setTheme = useCallback((themeId: string) => {
    setCurrentThemeId(themeId);
  }, []);

  return (
    <ThemeContext.Provider
      value={useMemo(
        () => ({
          currentTheme: currentThemeId,
          currentThemeLogo: currentThemeLogo,
          setTheme,
          themes: themesConfiguration?.themes,
          images,
          themesImageConfig: themesConfiguration?.images,
        }),
        [currentThemeId, setTheme, themesConfiguration, images, currentThemeLogo],
      )}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
