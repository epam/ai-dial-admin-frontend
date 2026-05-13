export type ActivityAuditEntity = Record<string, string | string[] | boolean | number | object>;

export enum DiffStatus {
  ADDED = 'added',
  REMOVED = 'removed',
  CHANGED = 'changed',
  MIRROR = 'mirror',
}

export enum DiffView {
  ALL = 'allParam',
  DIFF = 'diff',
}

export enum CompareView {
  NEXT = 'next',
  CURRENT = 'current',
}

export enum ActivityAuditType {
  Create = 'Create',
  Update = 'Update',
  Delete = 'Delete',
}

export enum ActivityAuditView {
  Config = 'Config',
  Deployments = 'Deployments',
  Asset = 'Asset',
}

export enum ActivityAuditResourceType {
  MODEL = 'Model',
  APPLICATION = 'Application',
  ADAPTER = 'Adapter',
  INTERCEPTOR = 'Interceptor',
  KEY = 'Key',
  ROLE = 'Role',
  ROUTE = 'Route',
  APPLICATION_TYPE_SCHEMA = 'ApplicationTypeSchema',
  INTERCEPTOR_TEMPLATE = 'InterceptorRunner',
  TOOLSET = 'ToolSet',
  SYSTEM_PROPERTIES = 'GlobalSettings',
  ADMIN_PROPERTIES = 'AdminSettings',
  ADAPTER_DEPLOYMENT = 'AdapterDeployment',
  APPLICATION_DEPLOYMENT = 'ApplicationDeployment',
  INTERCEPTOR_DEPLOYMENT = 'InterceptorDeployment',
  MCP_DEPLOYMENT = 'McpDeployment',
  NIM_DEPLOYMENT = 'NimDeployment',
  INFERENCE_DEPLOYMENT = 'InferenceDeployment',
  ADAPTER_IMAGE_DEFINITION = 'AdapterImageDefinition',
  APPLICATION_IMAGE_DEFINITION = 'ApplicationImageDefinition',
  INTERCEPTOR_IMAGE_DEFINITION = 'InterceptorImageDefinition',
  MCP_IMAGE_DEFINITION = 'McpImageDefinition',
  IMAGE_BUILD_DOMAIN_WHITELIST = 'ImageBuildDomainWhitelist',
}

const IMAGE_DEFINITION_RESOURCE_TYPES = new Set<string>([
  ActivityAuditResourceType.ADAPTER_IMAGE_DEFINITION,
  ActivityAuditResourceType.APPLICATION_IMAGE_DEFINITION,
  ActivityAuditResourceType.INTERCEPTOR_IMAGE_DEFINITION,
  ActivityAuditResourceType.MCP_IMAGE_DEFINITION,
]);

const DEPLOYMENT_MANAGER_RESOURCE_TYPES = new Set<string>([
  ActivityAuditResourceType.ADAPTER_IMAGE_DEFINITION,
  ActivityAuditResourceType.APPLICATION_IMAGE_DEFINITION,
  ActivityAuditResourceType.INTERCEPTOR_IMAGE_DEFINITION,
  ActivityAuditResourceType.MCP_IMAGE_DEFINITION,
  ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST,
  ActivityAuditResourceType.ADAPTER_DEPLOYMENT,
  ActivityAuditResourceType.APPLICATION_DEPLOYMENT,
  ActivityAuditResourceType.INTERCEPTOR_DEPLOYMENT,
  ActivityAuditResourceType.MCP_DEPLOYMENT,
  ActivityAuditResourceType.NIM_DEPLOYMENT,
  ActivityAuditResourceType.INFERENCE_DEPLOYMENT,
]);

export const isImageDefinitionResource = (type?: string): boolean =>
  !!type && IMAGE_DEFINITION_RESOURCE_TYPES.has(type);

export const isGlobalFirewallResource = (type?: string): boolean =>
  type === ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST;

export const isDeploymentManagerResource = (type?: string): boolean =>
  !!type && DEPLOYMENT_MANAGER_RESOURCE_TYPES.has(type);
