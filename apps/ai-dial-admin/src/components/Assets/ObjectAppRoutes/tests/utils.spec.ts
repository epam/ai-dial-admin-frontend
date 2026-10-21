import { describe, expect, test } from 'vitest';

import { ObjectAppRouteFormat } from '@/src/components/Assets/ObjectAppRoutes/models';
import { createObjectAppRoute, getObjectAppRouteMapper } from '@/src/components/Assets/ObjectAppRoutes/utils';
import { RoutePermission } from '@/src/models/dial/route';

describe('ObjectAppRoutes Utils', () => {
  test('keeps asset application routes unprefixed', () => {
    const mapper = getObjectAppRouteMapper(ObjectAppRouteFormat.AssetApplication);
    const route = mapper.toRoute('health', { paths: ['/health'], methods: ['GET'], upstreams: [] });

    expect(route).toEqual({ name: 'health', paths: ['/health'], methods: ['GET'], upstreams: [] });
    expect(mapper.fromRoute(route)).toEqual(route);
  });

  test('maps Core App Runner fields without converting the route collection', () => {
    const mapper = getObjectAppRouteMapper(ObjectAppRouteFormat.AppRunner);
    const rawRoute = {
      'dial:paths': ['/health'],
      'dial:methods': ['GET'],
      'dial:upstreams': [{ 'dial:endpoint': 'https://service', 'dial:extraData': '{"region":"eu"}' }],
      'dial:userRoles': ['admin'],
      'dial:permissions': ['WRITE'],
      'dial:response': { 'dial:status': 200, 'dial:body': 'ok' },
      'dial:attachmentPaths': { 'dial:requestBody': ['$.request'], 'dial:responseBody': ['$.response'] },
    };

    const route = mapper.toRoute('health', rawRoute);

    expect(route).toEqual({
      name: 'health',
      paths: ['/health'],
      methods: ['GET'],
      upstreams: [{ endpoint: 'https://service', extraData: { region: 'eu' } }],
      roleLimits: { admin: {} },
      permissions: [RoutePermission.WRITE],
      response: { status: 200, body: 'ok' },
      attachmentPaths: { requestBody: ['$.request'], responseBody: ['$.response'] },
    });
    expect(mapper.fromRoute(route, rawRoute)).toEqual(rawRoute);
  });

  test('creates a new route with editable defaults', () => {
    expect(createObjectAppRoute('health')).toMatchObject({
      name: 'health',
      paths: [''],
      upstreams: [],
      attachmentPaths: { requestBody: [''], responseBody: [''] },
    });
  });
});
