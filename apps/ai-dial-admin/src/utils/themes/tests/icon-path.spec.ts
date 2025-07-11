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
});
