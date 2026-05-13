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
