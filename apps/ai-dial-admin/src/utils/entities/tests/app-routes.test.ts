import { describe, test, expect } from 'vitest';
import { getAppRoutes } from '../app-routes';

describe('getAppRoutes', () => {
  test('returns undefined for undefined input', () => {
    expect(getAppRoutes(undefined)).toBeUndefined();
  });

  test('maps displayName to name if present', () => {
    const routes = [
      { name: 'route1', displayName: 'Display 1' },
      { name: 'route2', displayName: '' },
      { name: 'route3' },
    ];
    const result = getAppRoutes(routes as any);
    expect(result).toEqual([
      { name: 'Display 1', displayName: 'Display 1' },
      { name: 'route2', displayName: '' },
      { name: 'route3' },
    ]);
  });

  test('uses name if displayName is missing', () => {
    const routes = [{ name: 'routeA' }, { name: 'routeB', displayName: undefined }];
    const result = getAppRoutes(routes as any);
    expect(result).toEqual([{ name: 'routeA' }, { name: 'routeB', displayName: undefined }]);
  });
});
