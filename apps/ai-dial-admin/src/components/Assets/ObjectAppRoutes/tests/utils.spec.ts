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

  test('removes the previous Core response when switching to upstreams and restores it when switching back', () => {
    const mapper = getObjectAppRouteMapper(ObjectAppRouteFormat.AppRunner);
    const previousRoute = {
      'dial:paths': ['/health'],
      'dial:methods': ['GET'],
      'dial:response': { 'dial:status': 200, 'dial:body': 'ok' },
      'dial:customField': 'preserved',
    };
    const route = mapper.toRoute('health', previousRoute);

    const upstreamRoute = mapper.fromRoute({ ...route, response: undefined, upstreams: [] }, previousRoute);
    expect(upstreamRoute).not.toHaveProperty('dial:response');
    expect(upstreamRoute['dial:customField']).toBe('preserved');
    expect(mapper.toRoute('health', upstreamRoute).response).toBeUndefined();

    const responseRoute = mapper.fromRoute(
      { ...mapper.toRoute('health', upstreamRoute), response: { status: 201, body: 'created' } },
      upstreamRoute,
    );
    expect(responseRoute['dial:response']).toEqual({ 'dial:status': 201, 'dial:body': 'created' });
    expect(mapper.toRoute('health', responseRoute).response).toEqual({ status: 201, body: 'created' });
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
