import { ActivityAuditResourceType } from '@/src/types/activity-audit';

export const getRevisionRouteForEntityType = (type?: string, id?: string): string | null => {
  switch (type) {
    case ActivityAuditResourceType.MODEL:
      return `/models/${id}/revision/`;
    case ActivityAuditResourceType.APPLICATION:
      return `/applications/${id}/revision/`;
    case ActivityAuditResourceType.ADAPTER:
      return `/adapters/${id}/revision/`;
    case ActivityAuditResourceType.ASSISTANT:
      return `/assistants/${id}/revision/`;
    case ActivityAuditResourceType.INTERCEPTOR:
      return `/interceptors/${id}/revision/`;
    case ActivityAuditResourceType.KEY:
      return `/keys/${id}/revision/`;
    case ActivityAuditResourceType.ROLE:
      return `/roles/${id}/revision/`;
    case ActivityAuditResourceType.ROUTE:
      return `/routes/${id}/revision/`;
    case ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA:
      return `/applicationTypeSchemas/snapshot?id=${id}&revision=`;
    case ActivityAuditResourceType.ADDON:
      return `/addons/${id}/revision/`;
    default:
      return null;
  }
};

export const getRevisionRouteForAllEntities = (type?: string): string | null => {
  switch (type) {
    case ActivityAuditResourceType.MODEL:
      return `/models/revision/`;
    case ActivityAuditResourceType.APPLICATION:
      return `/applications/revision/`;
    case ActivityAuditResourceType.ADAPTER:
      return `/adapters/revision/`;
    case ActivityAuditResourceType.ASSISTANT:
      return `/assistants/revision/`;
    case ActivityAuditResourceType.INTERCEPTOR:
      return `/interceptors/revision/`;
    case ActivityAuditResourceType.KEY:
      return `/keys/revision/`;
    case ActivityAuditResourceType.ROLE:
      return `/roles/revision/`;
    case ActivityAuditResourceType.ROUTE:
      return `/routes/revision/`;
    case ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA:
      return `/applicationTypeSchemas/revision/`;
    case ActivityAuditResourceType.ADDON:
      return `/addons/revision/`;
    default:
      return null;
  }
};
