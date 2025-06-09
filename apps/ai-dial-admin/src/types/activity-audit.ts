export type ActivityAuditEntity = Record<string, string | string[] | boolean | number | object>;

export enum DiffStatus {
  ADDED = 'added',
  REMOVED = 'removed',
  CHANGED = 'changed',
}

export enum DiffView {
  ALL = 'allParam',
  DIFF = 'diff',
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
  ASSISTANT = 'Assistant',
  INTERCEPTOR = 'Interceptor',
  KEY = 'Key',
  ROLE = 'Role',
  ROUTE = 'Route',
  APPLICATION_TYPE_SCHEMA = 'ApplicationTypeSchema',
  ADDON = 'Addon',
}
