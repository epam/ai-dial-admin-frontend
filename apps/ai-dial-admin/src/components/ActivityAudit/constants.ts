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
  GLOBAL_INTERCEPTORS = 'globalInterceptors',
  ROLES = 'roles',
  SHARE = 'share',
  ROLE_LIMITS = 'roleLimits',
  AUTH = 'authSettings',
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
  APP_RUNNER_INTERCEPTORS = 'dial:applicationTypeInterceptors',
  APP_RUNNERS = 'applicationTypeSchemas',
  SOURCE = 'source',
  DEFAULTS = 'defaults',
  APP_PROPERTIES = 'applicationProperties',
  ALLOWED_DOMAINS = 'allowedDomains',
  DOMAINS = 'domains',
  RESOURCES = 'resources',
  SCALING = 'scaling',
  METADATA = 'metadata',
  PROBE_PROPERTIES = 'probeProperties',
  ENDPOINT_CONFIGURATION = 'endpointConfiguration',
  CONFIGURATION = 'configuration',
}

export const dateKeys = ['expiresAt', 'keyGeneratedAt', 'createdAt', 'updatedAt'];
export const appRunnerParameterKeys = ['properties', '$defs'];
export const shareEntities = ['application', 'conversation', 'file', 'prompt', 'tool_set'];
export const shareKeys = ['invitationTtl', 'maxAcceptedUsers'];

export const arrayParameterKeys = [
  EntityParameterKeys.TOPICS,
  EntityParameterKeys.TOOLS,
  EntityParameterKeys.HASHING_ORDER,
  EntityParameterKeys.PATHS,
  EntityParameterKeys.METHODS,
];
export const arrayStringParameterKeys = [EntityParameterKeys.PRICING, EntityParameterKeys.RESPONSE];
export const arrayObjectParameterKeys = [
  EntityParameterKeys.UPSTREAMS,
  EntityParameterKeys.DEFAULTS,
  EntityParameterKeys.APP_PROPERTIES,
  EntityParameterKeys.METADATA,
];
export const separateObjectParameterKeys = [
  EntityParameterKeys.INTERCEPTORS,
  EntityParameterKeys.GLOBAL_INTERCEPTORS,
  EntityParameterKeys.ROLE_LIMITS,
  EntityParameterKeys.DEFAULT_ROLE_LIMIT,
  EntityParameterKeys.AUTH,
  EntityParameterKeys.FEATURES,
  EntityParameterKeys.APPLICATIONS,
  EntityParameterKeys.ENTITIES,
  EntityParameterKeys.ROUTES,
  EntityParameterKeys.KEYS,
  EntityParameterKeys.ROLES,
  EntityParameterKeys.MODELS,
  EntityParameterKeys.DEPENDENCIES,
  EntityParameterKeys.SOURCE,
  EntityParameterKeys.APP_RUNNER_INTERCEPTORS,
  EntityParameterKeys.APP_RUNNERS,
  EntityParameterKeys.ALLOWED_DOMAINS,
  EntityParameterKeys.DOMAINS,
  EntityParameterKeys.RESOURCES,
  EntityParameterKeys.SCALING,
  EntityParameterKeys.PROBE_PROPERTIES,
];

export const DOMAIN_ACCESS_POLICY_KEY = 'domainAccessPolicy';

export const AUDIT_DIFF_INSERT_HIGHLIGHT_CLASS = 'rounded-sm border bg-success border-accent-secondary';
export const AUDIT_DIFF_DELETE_HIGHLIGHT_CLASS = 'rounded-sm border bg-error border-error';
