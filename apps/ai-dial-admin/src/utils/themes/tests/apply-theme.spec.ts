import { beforeEach, describe, expect, test } from 'vitest';

import { applyThemeColors } from '@/src/utils/themes/apply-theme-colors';
import { fallbackDarkTheme } from '@/src/utils/themes/constant';

describe('applyThemeColors', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('applies configured colors and persists the selected theme', () => {
    const element = document.createElement('div');
    const theme = {
      id: 'custom',
      displayName: 'Custom',
      colors: { background: 'white', foreground: 'black' },
      'app-logo': 'logo.svg',
    };

    applyThemeColors(element, theme);

    expect(element.style.getPropertyValue('--background')).toBe('white');
    expect(element.style.getPropertyValue('--foreground')).toBe('black');
    expect(localStorage.getItem('theme')).toBe('custom');
  });

  test('applies every fallback dark color when no theme is provided', () => {
    const element = document.createElement('div');

    applyThemeColors(element);

    Object.entries(fallbackDarkTheme).forEach(([key, value]) => {
      expect(element.style.getPropertyValue(`--${key}`)).toBe(value);
    });
    expect(localStorage.getItem('theme')).toBeNull();
  });
});
