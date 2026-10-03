import { useEffect, useLayoutEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderToString } from 'react-dom/server';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ThemeConfiguration } from '@/src/models/theme';
import { getFromLocalStorage } from '@/src/utils/local-storage';
import { applyThemeColors } from '@/src/utils/themes/apply-theme-colors';
import { ThemeProvider, useTheme } from '@/src/context/ThemeContext';

vi.unmock('@/src/context/ThemeContext');

vi.mock('@/src/utils/local-storage', () => ({
  getFromLocalStorage: vi.fn(),
}));

vi.mock('@/src/utils/themes/apply-theme-colors', () => ({
  applyThemeColors: vi.fn(),
}));

const themesConfiguration: ThemeConfiguration = {
  themes: [
    {
      id: 'dark',
      displayName: 'Dark',
      colors: { background: 'black' },
      'app-logo': 'dark-logo.svg',
    },
    {
      id: 'light',
      displayName: 'Light',
      colors: { background: 'white' },
      'app-logo': 'light-logo.svg',
    },
  ],
  images: {
    favicon: 'favicon.svg',
    'default-addon': 'addon.svg',
    'default-model': 'model.svg',
  },
};

const ThemeState = () => {
  const { currentTheme, currentThemeLogo, setTheme } = useTheme();

  return (
    <>
      <span>{currentTheme}</span>
      <span>{currentThemeLogo}</span>
      <button type="button" onClick={() => setTheme('light')}>
        Switch theme
      </button>
    </>
  );
};

describe('ThemeProvider', () => {
  beforeEach(() => {
    vi.mocked(applyThemeColors).mockReset();
    vi.mocked(getFromLocalStorage).mockReset().mockReturnValue(null);
  });

  test('withholds content during server rendering before theme initialization', () => {
    const html = renderToString(
      <ThemeProvider themesConfiguration={themesConfiguration}>
        <span>Application content</span>
      </ThemeProvider>,
    );

    expect(html).not.toContain('Application content');
  });

  test('applies a stored configured theme before mounting content with its state', async () => {
    const initializationOrder: string[] = [];
    vi.mocked(getFromLocalStorage).mockReturnValue('light');
    vi.mocked(applyThemeColors).mockImplementation(() => {
      initializationOrder.push('colors');
    });

    const Content = () => {
      const { currentTheme, currentThemeLogo } = useTheme();

      useLayoutEffect(() => {
        initializationOrder.push('content');
      }, []);

      return <span>{`${currentTheme}:${currentThemeLogo}`}</span>;
    };

    render(
      <ThemeProvider themesConfiguration={themesConfiguration}>
        <Content />
      </ThemeProvider>,
    );

    expect(await screen.findByText('light:light-logo.svg')).toBeTruthy();
    expect(applyThemeColors).toHaveBeenCalledWith(document.documentElement, themesConfiguration.themes[1]);
    expect(initializationOrder).toEqual(['colors', 'content']);
  });

  test('uses the first configured theme when no theme is stored', async () => {
    render(
      <ThemeProvider themesConfiguration={themesConfiguration}>
        <ThemeState />
      </ThemeProvider>,
    );

    expect(await screen.findByText('dark')).toBeTruthy();
    expect(applyThemeColors).toHaveBeenCalledWith(document.documentElement, themesConfiguration.themes[0]);
  });

  test.each([
    { name: 'theme configuration is unavailable', storedTheme: null, configuration: null },
    { name: 'stored theme is not configured', storedTheme: 'missing', configuration: themesConfiguration },
  ])('applies fallback colors when $name', async ({ storedTheme, configuration }) => {
    vi.mocked(getFromLocalStorage).mockReturnValue(storedTheme);

    render(
      <ThemeProvider themesConfiguration={configuration}>
        <span>Application content</span>
      </ThemeProvider>,
    );

    expect(await screen.findByText('Application content')).toBeTruthy();
    expect(applyThemeColors).toHaveBeenCalledWith(document.documentElement, undefined);
  });

  test('applies fallback colors and renders content when selected-theme initialization fails', async () => {
    vi.mocked(getFromLocalStorage).mockReturnValue('light');
    vi.mocked(applyThemeColors).mockImplementationOnce(() => {
      throw new Error('Theme failed');
    });

    render(
      <ThemeProvider themesConfiguration={themesConfiguration}>
        <span>Application content</span>
      </ThemeProvider>,
    );

    expect(await screen.findByText('Application content')).toBeTruthy();
    expect(applyThemeColors).toHaveBeenNthCalledWith(1, document.documentElement, themesConfiguration.themes[1]);
    expect(applyThemeColors).toHaveBeenNthCalledWith(2, document.documentElement, undefined);
  });

  test('renders content when both selected-theme and fallback initialization fail', async () => {
    vi.mocked(getFromLocalStorage).mockReturnValue('light');
    vi.mocked(applyThemeColors).mockImplementation(() => {
      throw new Error('Theme failed');
    });

    render(
      <ThemeProvider themesConfiguration={themesConfiguration}>
        <span>Application content</span>
      </ThemeProvider>,
    );

    expect(await screen.findByText('Application content')).toBeTruthy();
    expect(applyThemeColors).toHaveBeenCalledTimes(2);
  });

  test('keeps content mounted when the theme changes after initialization', async () => {
    const user = userEvent.setup();
    let mountCount = 0;

    const Content = () => {
      useEffect(() => {
        mountCount += 1;
      }, []);

      return <ThemeState />;
    };

    render(
      <ThemeProvider themesConfiguration={themesConfiguration}>
        <Content />
      </ThemeProvider>,
    );

    await screen.findByText('dark');
    await user.click(screen.getByRole('button', { name: 'Switch theme' }));

    await waitFor(() => expect(screen.getByText('light')).toBeTruthy());
    expect(mountCount).toBe(1);
    expect(applyThemeColors).toHaveBeenLastCalledWith(document.documentElement, themesConfiguration.themes[1]);
  });
});
