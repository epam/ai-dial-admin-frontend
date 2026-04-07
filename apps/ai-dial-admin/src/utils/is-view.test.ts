import { describe, expect, it } from 'vitest';

import { ApplicationRoute } from '@/src/types/routes';

import { isToolsetRoute } from './is-view';

describe('isToolsetRoute', () => {
  it.each([ApplicationRoute.Toolsets, ApplicationRoute.AssetsToolsets])('should return true for %s', (route) => {
    expect(isToolsetRoute(route)).toBe(true);
  });

  it.each([ApplicationRoute.Models, ApplicationRoute.Applications, undefined])(
    'should return false for %s',
    (route) => {
      expect(isToolsetRoute(route)).toBe(false);
    },
  );
});
