import {
  CoreAppRunnerRoute,
  CoreAppRunnerRoutePermission,
  CoreAppRunnerRoutes,
  CoreAppRunnerUpstream,
} from '@/src/models/dial/core-app-runner-route';
import { DialEndpointExtraData, DialModelEndpoint } from '@/src/models/dial/model';
import { DialAppRoute, RoutePermission } from '@/src/models/dial/route';

/** Route-name charset Core's app-runner meta schema allows as a `dial:applicationTypeRoutes` key. */
export const CORE_ROUTE_NAME_PATTERN = /^[a-zA-Z0-9_]+$/;

const toCorePermission = (permission: RoutePermission): CoreAppRunnerRoutePermission =>
  permission.toUpperCase() as CoreAppRunnerRoutePermission;

const fromCorePermission = (permission: CoreAppRunnerRoutePermission): RoutePermission =>
  permission.toLowerCase() as RoutePermission;

/** Core declares `dial:extraData` as a string; the editors hold it as either a string or an object. */
const toCoreExtraData = (extraData?: DialEndpointExtraData): string | undefined => {
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

const toNumber = (value?: number | string): number | undefined => {
  if (value == null || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

/**
 * Core's upstream is `additionalProperties: false` and declares only these five fields — `id`,
 * `responsesEndpoint`, and `secretExtraData` are dropped rather than sent, matching what the admin
 * BE's mapper does today.
 */
const toCoreUpstream = (upstream: DialModelEndpoint): CoreAppRunnerUpstream => ({
  'dial:endpoint': upstream.endpoint ?? '',
  ...(upstream.key != null && { 'dial:key': upstream.key }),
  ...(toCoreExtraData(upstream.extraData) != null && { 'dial:extraData': toCoreExtraData(upstream.extraData) }),
  ...(toNumber(upstream.weight) != null && { 'dial:weight': toNumber(upstream.weight) }),
  ...(toNumber(upstream.tier) != null && { 'dial:tier': toNumber(upstream.tier) }),
});

const fromCoreUpstream = (upstream: CoreAppRunnerUpstream): DialModelEndpoint => ({
  endpoint: upstream['dial:endpoint'],
  ...(upstream['dial:key'] != null && { key: upstream['dial:key'] }),
  ...(fromCoreExtraData(upstream['dial:extraData']) != null && {
    extraData: fromCoreExtraData(upstream['dial:extraData']),
  }),
  ...(upstream['dial:weight'] != null && { weight: upstream['dial:weight'] }),
  ...(upstream['dial:tier'] != null && { tier: upstream['dial:tier'] }),
});

const toCoreRoute = (route: DialAppRoute): CoreAppRunnerRoute => ({
  'dial:paths': route.paths ?? [],
  'dial:methods': route.methods ?? [],
  'dial:upstreams': (route.upstreams ?? []).map(toCoreUpstream),
  ...(route.roleLimits != null && { 'dial:userRoles': Object.keys(route.roleLimits) }),
  ...(route.rewritePath != null && { 'dial:rewritePath': route.rewritePath }),
  ...(route.order != null && { 'dial:order': route.order }),
  ...(route.maxRetryAttempts != null && { 'dial:maxRetryAttempts': route.maxRetryAttempts }),
  ...(route.permissions != null && { 'dial:permissions': route.permissions.map(toCorePermission) }),
  ...(route.response != null && {
    'dial:response': {
      'dial:status': toNumber(route.response.status) ?? 200,
      'dial:body': route.response.body ?? '',
    },
  }),
  ...(route.attachmentPaths != null && {
    'dial:attachmentPaths': {
      'dial:requestBody': route.attachmentPaths.requestBody ?? [],
      'dial:responseBody': route.attachmentPaths.responseBody ?? [],
    },
  }),
});

const fromCoreRoute = (name: string, route: CoreAppRunnerRoute): DialAppRoute => ({
  name,
  paths: route['dial:paths'] ?? [],
  methods: route['dial:methods'] ?? [],
  upstreams: (route['dial:upstreams'] ?? []).map(fromCoreUpstream),
  ...(route['dial:userRoles'] != null && {
    roleLimits: Object.fromEntries(route['dial:userRoles'].map((role) => [role, {}])),
  }),
  ...(route['dial:rewritePath'] != null && { rewritePath: route['dial:rewritePath'] }),
  ...(route['dial:order'] != null && { order: route['dial:order'] }),
  ...(route['dial:maxRetryAttempts'] != null && { maxRetryAttempts: route['dial:maxRetryAttempts'] }),
  ...(route['dial:permissions'] != null && { permissions: route['dial:permissions'].map(fromCorePermission) }),
  ...(route['dial:response'] != null && {
    response: { status: route['dial:response']['dial:status'], body: route['dial:response']['dial:body'] },
  }),
  ...(route['dial:attachmentPaths'] != null && {
    attachmentPaths: {
      requestBody: route['dial:attachmentPaths']['dial:requestBody'] ?? [],
      responseBody: route['dial:attachmentPaths']['dial:responseBody'] ?? [],
    },
  }),
});

export const getCoreRouteName = (route: DialAppRoute): string => route.displayName || route.name || '';

/**
 * Converts the editors' route array into Core's name-keyed object. Duplicate names throw rather than
 * silently collapsing — an object key can only hold one route, so a duplicate would drop a route the
 * user still sees in the editor.
 */
export const toCoreAppRoutes = (routes?: DialAppRoute[]): CoreAppRunnerRoutes | undefined => {
  if (!routes) {
    return undefined;
  }
  const result: CoreAppRunnerRoutes = {};
  for (const route of routes) {
    const name = getCoreRouteName(route);
    if (name in result) {
      throw new Error(`Duplicate application type route name: ${name}`);
    }
    result[name] = toCoreRoute(route);
  }
  return result;
};

export const fromCoreAppRoutes = (routes?: CoreAppRunnerRoutes): DialAppRoute[] | undefined => {
  if (!routes) {
    return undefined;
  }
  return Object.entries(routes).map(([name, route]) => fromCoreRoute(name, route));
};
