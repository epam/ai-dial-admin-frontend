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
}
