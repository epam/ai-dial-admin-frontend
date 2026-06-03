import { describe, expect, test } from 'vitest';
import { getIconPath } from '../icon-path';

describe('Utils :: icon path', () => {
  test('Should do not find theme', () => {
    const res = getIconPath();

    expect(res).toBe('/api/themes/');
  });

  test('Should do not find theme', () => {
    const res = getIconPath('icon');

    expect(res).toBe('/api/themes/icon');
  });

  test('Should keep absolute app path untouched', () => {
    const res = getIconPath('/images/icons/fallback-entity-icon.svg');

    expect(res).toBe('/images/icons/fallback-entity-icon.svg');
  });

  test('Should keep full URL untouched', () => {
    const res = getIconPath('https://cdn.example.com/icon.svg');

    expect(res).toBe('https://cdn.example.com/icon.svg');
  });
});
