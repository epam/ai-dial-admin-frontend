import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { ApplicationRoute } from '@/src/types/routes';

export const getRollbackRedirectHref = (entityType?: ActivityAuditResourceType, resourceId?: string) => {
  if (!entityType || !resourceId) {
    return ApplicationRoute.ActivityAudit;
  }

  let redirectHref = '';
  switch (entityType) {
    case ActivityAuditResourceType.MODEL:
      redirectHref = `${ApplicationRoute.Models}/${encodeURIComponent(resourceId)}`;
      break;
    case ActivityAuditResourceType.APPLICATION:
      redirectHref = `${ApplicationRoute.Applications}/${encodeURIComponent(resourceId)}`;
      break;
    case ActivityAuditResourceType.TOOLSET:
      redirectHref = `${ApplicationRoute.Toolsets}/${encodeURIComponent(resourceId)}`;
      break;
    case ActivityAuditResourceType.INTERCEPTOR:
      redirectHref = `${ApplicationRoute.Interceptors}/${encodeURIComponent(resourceId)}`;
      break;
    case ActivityAuditResourceType.ROUTE:
      redirectHref = `${ApplicationRoute.Routes}/${encodeURIComponent(resourceId)}`;
      break;
    case ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA:
      redirectHref = `${ApplicationRoute.ApplicationRunners}/${encodeURIComponent(resourceId)}`;
      break;
    case ActivityAuditResourceType.INTERCEPTOR_TEMPLATE:
      redirectHref = `${ApplicationRoute.InterceptorTemplates}/${encodeURIComponent(resourceId)}`;
      break;
    case ActivityAuditResourceType.ADAPTER:
      redirectHref = `${ApplicationRoute.Adapters}/${encodeURIComponent(resourceId)}`;
      break;
    case ActivityAuditResourceType.ROLE:
      redirectHref = `${ApplicationRoute.Roles}/${encodeURIComponent(resourceId)}`;
      break;
    case ActivityAuditResourceType.KEY:
      redirectHref = `${ApplicationRoute.Keys}/${encodeURIComponent(resourceId)}`;
      break;
    default:
      redirectHref = ApplicationRoute.ActivityAudit;
  }

  return redirectHref;
};
