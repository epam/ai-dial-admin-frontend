import { describe, expect, test } from 'vitest';

import { fallbackDarkTheme, fallbackLightTheme } from '@/src/utils/themes/constant';
import { getThemePalette } from '@/src/utils/themes/get-theme-palette';

describe('getThemePalette', () => {
  test('returns the light palette for the light theme', () => {
    expect(getThemePalette('light')).toBe(fallbackLightTheme);
  });

  test('returns the dark palette for the dark theme', () => {
    expect(getThemePalette('dark')).toBe(fallbackDarkTheme);
  });

  test('falls back to the light palette for a custom or missing theme id', () => {
    expect(getThemePalette('light-orange')).toBe(fallbackLightTheme);
    expect(getThemePalette()).toBe(fallbackLightTheme);
  });

  test('both palettes define the same keys', () => {
    expect(Object.keys(fallbackLightTheme).sort()).toEqual(Object.keys(fallbackDarkTheme).sort());
  });
});
