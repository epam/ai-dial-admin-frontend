import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { ApplicationRoute } from '@/src/types/routes';

export const getRollbackRedirectHref = (entityType?: ActivityAuditResourceType, resourceId?: string) => {
  if (!entityType || !resourceId) {
    return ApplicationRoute.ActivityAudit;
  }

  switch (entityType) {
    case ActivityAuditResourceType.MODEL:
      return `${ApplicationRoute.Models}/${encodeURIComponent(resourceId)}`;
    case ActivityAuditResourceType.APPLICATION:
      return `${ApplicationRoute.Applications}/${encodeURIComponent(resourceId)}`;
    case ActivityAuditResourceType.TOOLSET:
      return `${ApplicationRoute.Toolsets}/${encodeURIComponent(resourceId)}`;
    case ActivityAuditResourceType.INTERCEPTOR:
      return `${ApplicationRoute.Interceptors}/${encodeURIComponent(resourceId)}`;
    case ActivityAuditResourceType.ROUTE:
      return `${ApplicationRoute.Routes}/${encodeURIComponent(resourceId)}`;
    case ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA:
      return `${ApplicationRoute.ApplicationRunners}/${encodeURIComponent(resourceId)}`;
    case ActivityAuditResourceType.INTERCEPTOR_TEMPLATE:
      return `${ApplicationRoute.InterceptorTemplates}/${encodeURIComponent(resourceId)}`;
    case ActivityAuditResourceType.ADAPTER:
      return `${ApplicationRoute.Adapters}/${encodeURIComponent(resourceId)}`;
    case ActivityAuditResourceType.ROLE:
      return `${ApplicationRoute.Roles}/${encodeURIComponent(resourceId)}`;
    case ActivityAuditResourceType.KEY:
      return `${ApplicationRoute.Keys}/${encodeURIComponent(resourceId)}`;
    default:
      return ApplicationRoute.ActivityAudit;
  }
};
