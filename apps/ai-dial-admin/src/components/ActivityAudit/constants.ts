import { SortDirectionDto } from '@/src/types/request';

export const sorts = [
  {
    column: 'id',
    direction: SortDirectionDto.DESC,
  },
];

export enum EntityParameterKeys {
  TOPICS = 'topics',
  TOOLS = 'allowedTools',
  HASHING_ORDER = 'fieldsHashingOrder',
  LIMITS = 'limits',
  PRICING = 'pricing',
  INTERCEPTORS = 'interceptors',
  ROLES = 'roles',
  SHARE = 'share',
  ROLE_LIMITS = 'roleLimits',
  DEFAULT_ROLE_LIMIT = 'defaultRoleLimit',
  ROLE_SHARE_LIMITS = 'roleShareResourceLimits',
  COST_LIMIT = 'costLimit',
  DEFAULT_ROLE_SHARE_LIMIT = 'defaultRoleShareResourceLimit',
  UPSTREAMS = 'upstreams',
  FEATURES = 'features',
  ENABLED = 'enabled',
  PROPERTIES = 'properties',
  PATHS = 'paths',
  METHODS = 'methods',
  RESPONSE = 'response',
  APPLICATIONS = 'applications',
  ENTITIES = 'entities',
  DEFS = '$defs',
  KEYS = 'grantedKeys',
  PARAMETERS = 'parameters',
  MODELS = 'models',
  UNIT = 'unit',
  DEPENDENCIES = 'dependencies',
  // app routes
  ROUTES = 'routes',
  APP_RUNNER_ROUTES = 'dial:applicationTypeRoutes',
  SOURCE = 'source',
}
