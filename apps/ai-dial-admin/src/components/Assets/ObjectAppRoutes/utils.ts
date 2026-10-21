import { DialEndpointExtraData, DialModelEndpoint } from '@/src/models/dial/model';
import { AttachmentPaths, DialAppRoute, RoutePermission } from '@/src/models/dial/route';
import { ObjectAppRouteFormat, ObjectAppRouteMapper } from './models';

const toCoreExtraData = (extraData?: DialEndpointExtraData | null): string | undefined => {
  if (extraData == null) {
    return undefined;
  }
  return typeof extraData === 'string' ? extraData : JSON.stringify(extraData);
};

const fromCoreExtraData = (extraData?: string): DialEndpointExtraData | undefined => {
  if (extraData == null) {
    return undefined;
  }
  try {
    return JSON.parse(extraData) as DialEndpointExtraData;
  } catch {
    return extraData;
  }
};

const toCoreUpstream = (upstream: DialModelEndpoint): Record<string, unknown> => ({
  'dial:endpoint': upstream.endpoint ?? '',
  ...(upstream.key != null && { 'dial:key': upstream.key }),
  ...(toCoreExtraData(upstream.extraData) != null && { 'dial:extraData': toCoreExtraData(upstream.extraData) }),
  ...(upstream.weight != null && { 'dial:weight': Number(upstream.weight) }),
  ...(upstream.tier != null && { 'dial:tier': Number(upstream.tier) }),
});

const fromCoreUpstream = (upstream: Record<string, unknown>): DialModelEndpoint => ({
  endpoint: upstream['dial:endpoint'] as string,
  ...(upstream['dial:key'] != null && { key: upstream['dial:key'] as string }),
  ...(fromCoreExtraData(upstream['dial:extraData'] as string | undefined) != null && {
    extraData: fromCoreExtraData(upstream['dial:extraData'] as string),
  }),
  ...(upstream['dial:weight'] != null && { weight: upstream['dial:weight'] as number }),
  ...(upstream['dial:tier'] != null && { tier: upstream['dial:tier'] as number }),
});

const assetApplicationMapper: ObjectAppRouteMapper = {
  toRoute: (name, route) => ({ ...route, name }) as DialAppRoute,
  fromRoute: (route, previousRoute) => ({ ...previousRoute, ...route }),
};

const appRunnerMapper: ObjectAppRouteMapper = {
  toRoute: (name, route) => ({
    name,
    paths: (route['dial:paths'] as string[] | undefined) ?? [],
    methods: (route['dial:methods'] as string[] | undefined) ?? [],
    upstreams: ((route['dial:upstreams'] as Record<string, unknown>[] | undefined) ?? []).map(fromCoreUpstream),
    ...(route['dial:userRoles'] != null && {
      roleLimits: Object.fromEntries(((route['dial:userRoles'] as string[]) ?? []).map((role) => [role, {}])),
    }),
    ...(route['dial:rewritePath'] != null && { rewritePath: route['dial:rewritePath'] as boolean }),
    ...(route['dial:order'] != null && { order: route['dial:order'] as number }),
    ...(route['dial:maxRetryAttempts'] != null && { maxRetryAttempts: route['dial:maxRetryAttempts'] as number }),
    ...(route['dial:permissions'] != null && {
      permissions: (route['dial:permissions'] as string[]).map(
        (permission) => permission.toLowerCase() as RoutePermission,
      ),
    }),
    ...(route['dial:response'] != null && {
      response: {
        status: (route['dial:response'] as Record<string, unknown>)['dial:status'] as number,
        body: (route['dial:response'] as Record<string, unknown>)['dial:body'] as string,
      },
    }),
    ...(route['dial:attachmentPaths'] != null && {
      attachmentPaths: {
        requestBody: ((route['dial:attachmentPaths'] as Record<string, unknown>)['dial:requestBody'] as string[]) ?? [],
        responseBody:
          ((route['dial:attachmentPaths'] as Record<string, unknown>)['dial:responseBody'] as string[]) ?? [],
      },
    }),
  }),
  fromRoute: (route, previousRoute) => ({
    ...previousRoute,
    'dial:paths': route.paths ?? [],
    'dial:methods': route.methods ?? [],
    'dial:upstreams': (route.upstreams ?? []).map(toCoreUpstream),
    ...(route.roleLimits != null && { 'dial:userRoles': Object.keys(route.roleLimits) }),
    ...(route.rewritePath != null && { 'dial:rewritePath': route.rewritePath }),
    ...(route.order != null && { 'dial:order': route.order }),
    ...(route.maxRetryAttempts != null && { 'dial:maxRetryAttempts': route.maxRetryAttempts }),
    ...(route.permissions != null && {
      'dial:permissions': route.permissions.map((permission) => permission.toUpperCase()),
    }),
    ...(route.response != null && {
      'dial:response': {
        'dial:status': route.response.status,
        'dial:body': route.response.body,
      },
    }),
    ...(route.attachmentPaths != null && {
      'dial:attachmentPaths': {
        'dial:requestBody': route.attachmentPaths.requestBody,
        'dial:responseBody': route.attachmentPaths.responseBody,
      },
    }),
  }),
};

export const getObjectAppRouteMapper = (format: ObjectAppRouteFormat): ObjectAppRouteMapper =>
  format === ObjectAppRouteFormat.AppRunner ? appRunnerMapper : assetApplicationMapper;

export const createObjectAppRoute = (name: string): DialAppRoute => ({
  name,
  upstreams: [],
  paths: [''],
  attachmentPaths: { requestBody: [''], responseBody: [''] } as AttachmentPaths,
  maxRetryAttempts: 1,
  order: 1,
});
