import { describe, expect, test } from 'vitest';

import { CoreAppRunnerRoutes } from '@/src/models/dial/core-app-runner-route';
import { DialAppRoute, RoutePermission } from '@/src/models/dial/route';
import { CORE_ROUTE_NAME_PATTERN, fromCoreAppRoutes, getCoreRouteName, toCoreAppRoutes } from '../core-app-routes';

const route: DialAppRoute = {
  name: 'my_route',
  paths: ['/v1/chat'],
  methods: ['POST'],
  upstreams: [{ endpoint: 'http://svc/chat', key: 'secret', weight: 2, tier: 1 }],
  rewritePath: true,
  order: 5,
  maxRetryAttempts: 3,
  permissions: [RoutePermission.READ, RoutePermission.WRITE],
  response: { status: 204, body: 'ok' },
  attachmentPaths: { requestBody: ['$.a'], responseBody: ['$.b'] },
  roleLimits: { admin: {}, viewer: {} },
};

describe('App Runner Utils :: toCoreAppRoutes', () => {
  test('Should key the object by route name and prefix every field', () => {
    const result = toCoreAppRoutes([route]);

    expect(Object.keys(result ?? {})).toEqual(['my_route']);
    expect(result?.my_route).toEqual({
      'dial:paths': ['/v1/chat'],
      'dial:methods': ['POST'],
      'dial:upstreams': [
        { 'dial:endpoint': 'http://svc/chat', 'dial:key': 'secret', 'dial:weight': 2, 'dial:tier': 1 },
      ],
      'dial:userRoles': ['admin', 'viewer'],
      'dial:rewritePath': true,
      'dial:order': 5,
      'dial:maxRetryAttempts': 3,
      'dial:permissions': ['READ', 'WRITE'],
      'dial:response': { 'dial:status': 204, 'dial:body': 'ok' },
      'dial:attachmentPaths': { 'dial:requestBody': ['$.a'], 'dial:responseBody': ['$.b'] },
    });
  });

  test('Should prefer displayName over name as the route key', () => {
    const result = toCoreAppRoutes([{ ...route, displayName: 'display_key' }]);

    expect(Object.keys(result ?? {})).toEqual(['display_key']);
  });

  test('Should uppercase permissions', () => {
    const result = toCoreAppRoutes([{ ...route, permissions: [RoutePermission.WRITE] }]);

    expect(result?.my_route['dial:permissions']).toEqual(['WRITE']);
  });

  test('Should serialize object extraData to a string', () => {
    const result = toCoreAppRoutes([
      { ...route, upstreams: [{ endpoint: 'http://svc', extraData: { region: 'eu' } }] },
    ]);

    expect(result?.my_route['dial:upstreams'][0]['dial:extraData']).toEqual('{"region":"eu"}');
  });

  test('Should pass a string extraData through unchanged', () => {
    const result = toCoreAppRoutes([{ ...route, upstreams: [{ endpoint: 'http://svc', extraData: 'raw' }] }]);

    expect(result?.my_route['dial:upstreams'][0]['dial:extraData']).toEqual('raw');
  });

  test('Should drop upstream fields Core does not declare', () => {
    const result = toCoreAppRoutes([
      {
        ...route,
        upstreams: [
          { id: 'u1', endpoint: 'http://svc', responsesEndpoint: 'http://svc/responses', secretExtraData: 'shh' },
        ],
      },
    ]);

    expect(result?.my_route['dial:upstreams'][0]).toEqual({ 'dial:endpoint': 'http://svc' });
  });

  test('Should default missing required collections to empty arrays', () => {
    const result = toCoreAppRoutes([{ name: 'bare' }]);

    expect(result?.bare).toEqual({ 'dial:paths': [], 'dial:methods': [], 'dial:upstreams': [] });
  });

  test('Should coerce a string response status to a number', () => {
    const result = toCoreAppRoutes([{ ...route, response: { status: '201', body: 'created' } }]);

    expect(result?.my_route['dial:response']).toEqual({ 'dial:status': 201, 'dial:body': 'created' });
  });

  test('Should throw on duplicate route names rather than dropping a route', () => {
    expect(() => toCoreAppRoutes([route, { ...route }])).toThrow(/Duplicate application type route name: my_route/);
  });

  test('Should return undefined when routes are absent', () => {
    expect(toCoreAppRoutes(undefined)).toBeUndefined();
  });
});

describe('App Runner Utils :: fromCoreAppRoutes', () => {
  test('Should reverse toCoreAppRoutes', () => {
    const core = toCoreAppRoutes([route]);

    expect(fromCoreAppRoutes(core)).toEqual([route]);
  });

  test('Should use the object key as the route name', () => {
    const core: CoreAppRunnerRoutes = {
      from_key: { 'dial:paths': ['/a'], 'dial:methods': ['GET'], 'dial:upstreams': [] },
    };

    expect(fromCoreAppRoutes(core)?.[0].name).toEqual('from_key');
  });

  test('Should lowercase permissions', () => {
    const core: CoreAppRunnerRoutes = {
      r: { 'dial:paths': [], 'dial:methods': [], 'dial:upstreams': [], 'dial:permissions': [] },
    };
    core.r['dial:permissions'] = ['READ'] as never;

    expect(fromCoreAppRoutes(core)?.[0].permissions).toEqual([RoutePermission.READ]);
  });

  test('Should parse JSON extraData back to an object', () => {
    const core: CoreAppRunnerRoutes = {
      r: {
        'dial:paths': [],
        'dial:methods': [],
        'dial:upstreams': [{ 'dial:endpoint': 'http://svc', 'dial:extraData': '{"region":"eu"}' }],
      },
    };

    expect(fromCoreAppRoutes(core)?.[0].upstreams?.[0].extraData).toEqual({ region: 'eu' });
  });

  test('Should leave non-JSON extraData as a string', () => {
    const core: CoreAppRunnerRoutes = {
      r: {
        'dial:paths': [],
        'dial:methods': [],
        'dial:upstreams': [{ 'dial:endpoint': 'http://svc', 'dial:extraData': 'raw' }],
      },
    };

    expect(fromCoreAppRoutes(core)?.[0].upstreams?.[0].extraData).toEqual('raw');
  });

  test('Should map userRoles back to roleLimits keys', () => {
    const core: CoreAppRunnerRoutes = {
      r: { 'dial:paths': [], 'dial:methods': [], 'dial:upstreams': [], 'dial:userRoles': ['admin'] },
    };

    expect(fromCoreAppRoutes(core)?.[0].roleLimits).toEqual({ admin: {} });
  });

  test('Should return undefined when routes are absent', () => {
    expect(fromCoreAppRoutes(undefined)).toBeUndefined();
  });
});

describe('App Runner Utils :: route name constraints', () => {
  test('Should expose the charset Core allows as a route key', () => {
    expect(CORE_ROUTE_NAME_PATTERN.test('my_route1')).toBe(true);
    expect(CORE_ROUTE_NAME_PATTERN.test('my-route')).toBe(false);
    expect(CORE_ROUTE_NAME_PATTERN.test('my.route')).toBe(false);
    expect(CORE_ROUTE_NAME_PATTERN.test('my route')).toBe(false);
  });

  test('Should resolve the key that will be validated', () => {
    expect(getCoreRouteName({ name: 'a', displayName: 'b' })).toEqual('b');
    expect(getCoreRouteName({ name: 'a' })).toEqual('a');
    expect(getCoreRouteName({})).toEqual('');
  });
});
