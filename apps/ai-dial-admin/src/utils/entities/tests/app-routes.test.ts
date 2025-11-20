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
      {
        name: 'Display 1',
        displayName: 'Display 1',
        paths: [],
        attachmentPaths: {
          requestBody: [],
          responseBody: [],
        },
      },
      {
        name: 'route2',
        displayName: '',
        paths: [],
        attachmentPaths: {
          requestBody: [],
          responseBody: [],
        },
      },
      {
        name: 'route3',
        paths: [],
        attachmentPaths: {
          requestBody: [],
          responseBody: [],
        },
      },
    ]);
  });

  test('uses name if displayName is missing', () => {
    const routes = [{ name: 'routeA' }, { name: 'routeB', displayName: undefined }];
    const result = getAppRoutes(routes as any);
    expect(result).toEqual([
      {
        name: 'routeA',
        paths: [],
        attachmentPaths: {
          requestBody: [],
          responseBody: [],
        },
      },
      {
        name: 'routeB',
        displayName: undefined,
        paths: [],
        attachmentPaths: {
          requestBody: [],
          responseBody: [],
        },
      },
    ]);
  });
  test('cleans empty strings from paths and attachmentPaths', () => {
    const routes = [
      {
        name: 'route1',
        paths: ['a', '', 'b'],
        attachmentPaths: {
          requestBody: ['', 'req1', ''],
          responseBody: ['res1', '', ''],
        },
      },
      {
        name: 'route2',
        paths: undefined,
        attachmentPaths: {
          requestBody: undefined,
          responseBody: undefined,
        },
      },
    ];
    const result = getAppRoutes(routes as any);
    expect(result?.[0].paths).toEqual(['a', 'b']);
    expect(result?.[0].attachmentPaths.requestBody).toEqual(['req1']);
    expect(result?.[0].attachmentPaths.responseBody).toEqual(['res1']);
    expect(result?.[1].paths).toEqual([]);
    expect(result?.[1].attachmentPaths.requestBody).toEqual([]);
    expect(result?.[1].attachmentPaths.responseBody).toEqual([]);
  });
});
