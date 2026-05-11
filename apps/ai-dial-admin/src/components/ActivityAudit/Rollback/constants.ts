import { ActivityAuditResourceType } from '@/src/types/activity-audit';

export const SYSTEM_ROLLBACK_ID = 'system-rollback';
export const SYSTEM_ROLLBACK_ENTITIES = [
  ActivityAuditResourceType.MODEL,
  ActivityAuditResourceType.APPLICATION,
  ActivityAuditResourceType.TOOLSET,
  ActivityAuditResourceType.ROUTE,
  ActivityAuditResourceType.ROLE,
  ActivityAuditResourceType.KEY,
  ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA,
  ActivityAuditResourceType.INTERCEPTOR,
  ActivityAuditResourceType.ADAPTER,
  ActivityAuditResourceType.INTERCEPTOR_TEMPLATE,
];

export const SYSTEM_ROLLBACK_TAB_NAME: Partial<Record<ActivityAuditResourceType, string>> = {
  [ActivityAuditResourceType.MODEL]: 'Models',
  [ActivityAuditResourceType.APPLICATION]: 'Applications',
  [ActivityAuditResourceType.ADAPTER]: 'Adapters',
  [ActivityAuditResourceType.INTERCEPTOR]: 'Interceptors',
  [ActivityAuditResourceType.KEY]: 'Keys',
  [ActivityAuditResourceType.ROLE]: 'Roles',
  [ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA]: 'ApplicationRunners',
  [ActivityAuditResourceType.ROUTE]: 'Routes',
  [ActivityAuditResourceType.INTERCEPTOR_TEMPLATE]: 'InterceptorTemplates',
  [ActivityAuditResourceType.TOOLSET]: 'Toolsets',
  [ActivityAuditResourceType.SYSTEM_PROPERTIES]: 'System Properties',
};
