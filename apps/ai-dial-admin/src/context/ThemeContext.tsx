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
  images:
    | {
        url: string;
        name: string;
      }[]
    | null;
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
  themeImages?: { name: string }[] | null;
}) => {
  const [currentThemeId, setCurrentThemeId] = useState<string>(DEFAULT_THEME);
  const [currentThemeLogo, setCurrentThemeLogo] = useState<string | undefined>(void 0);

  const excludedImageNames = ['logo', 'favicon', 'config'];
  const images = themeImages
    ? themeImages
        .map((image) => ({
          url: image.name,
          name: image.name.split('.')[0],
        }))
        .filter(({ name }) => {
          const lower = name.toLowerCase();
          return name && !excludedImageNames.some((word) => lower.includes(word));
        })
    : null;

  const updateTheme = useCallback(
    (themeId: string) => {
      const theme = themesConfiguration?.themes.find((t) => t.id === themeId);
      const root = document.documentElement;
      applyThemeColors(root, theme);
      setCurrentThemeId(themeId);
      setCurrentThemeLogo(theme?.['app-logo']);
    },
    [themesConfiguration],
  );

  useEffect(() => {
    const storedTheme = typeof window !== 'undefined' ? getFromLocalStorage('theme') : null;
    const configuredTheme = storedTheme || themesConfiguration?.themes?.[0].id;
    if (configuredTheme) {
      updateTheme(configuredTheme);
    }
  }, [themesConfiguration, updateTheme]);

  const setTheme = useCallback(
    (themeId: string) => {
      updateTheme(themeId);
    },
    [updateTheme],
  );

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
