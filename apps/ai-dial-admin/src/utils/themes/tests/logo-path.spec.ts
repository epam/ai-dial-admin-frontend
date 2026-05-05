import { describe, expect, test } from 'vitest';
import { getLogoPath } from '../logo-path';
import { ThemeConfiguration } from '@/src/models/theme';

const baseConfig: ThemeConfiguration = {
  themes: [
    { id: 'dark', displayName: 'Dark', colors: {}, 'app-logo': 'dark-app-logo.svg' },
    { id: 'light', displayName: 'Light', colors: {}, 'app-logo': 'light-app-logo.svg' },
  ],
  images: {
    'default-addon': 'addon.svg',
    'default-model': 'model.svg',
    favicon: 'favicon.ico',
    'admin-logo-light': 'admin-light.svg',
    'admin-logo-dark': 'admin-dark.svg',
  },
};

describe('Utils :: getLogoPath', () => {
  test('Should return admin-logo-dark when both admin logos present and themeId is DEFAULT_THEME', () => {
    const res = getLogoPath(baseConfig, 'dark');

    expect(res).toBe('admin-dark.svg');
  });

  test('Should return admin-logo-light when both admin logos present and themeId is not DEFAULT_THEME', () => {
    const res = getLogoPath(baseConfig, 'light');

    expect(res).toBe('admin-light.svg');
  });

  test('Should return theme app-logo as fallback when admin-logo-light is missing', () => {
    const config: ThemeConfiguration = {
      ...baseConfig,
      images: { ...baseConfig.images, 'admin-logo-light': undefined },
    };

    const res = getLogoPath(config, 'light');

    expect(res).toBe('light-app-logo.svg');
  });

  test('Should return theme app-logo as fallback when admin-logo-dark is missing', () => {
    const config: ThemeConfiguration = {
      ...baseConfig,
      images: { ...baseConfig.images, 'admin-logo-dark': undefined },
    };

    const res = getLogoPath(config, 'dark');

    expect(res).toBe('dark-app-logo.svg');
  });

  test('Should return empty string when both admin logos missing and theme not found', () => {
    const config: ThemeConfiguration = {
      ...baseConfig,
      images: { ...baseConfig.images, 'admin-logo-light': undefined, 'admin-logo-dark': undefined },
    };

    const res = getLogoPath(config, 'unknown');

    expect(res).toBe('');
  });

  test('Should return empty string when themesConfiguration is undefined', () => {
    const res = getLogoPath(undefined as unknown as ThemeConfiguration, 'dark');

    expect(res).toBe('');
  });
});
