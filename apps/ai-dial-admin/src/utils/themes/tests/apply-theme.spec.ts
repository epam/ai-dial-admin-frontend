import { describe, expect, test } from 'vitest';
import { applyThemeColors } from '../apply-theme-colors';

describe('Utils :: applyThemeColors', () => {
  test('Should do not find theme', () => {
    const div = document.createElement('div');
    applyThemeColors(div, { id: 'theme', displayName: 'theme', colors: { red2: 'red' }, 'app-logo': 'logo.svg' });

    expect(div.style.getPropertyValue('--red')).toBe('');
  });

  test('Should do not find theme', () => {
    const div = document.createElement('div');
    applyThemeColors(div);

    expect(div.style.getPropertyValue('--red')).toBe('');
  });

  test('Should set colors', () => {
    const div = document.createElement('div');
    applyThemeColors(div, { id: 'theme', displayName: 'theme', colors: { red: 'red' }, 'app-logo': 'logo.svg' });
    expect(div.style.getPropertyValue('--red')).toBe('red');
  });
});
