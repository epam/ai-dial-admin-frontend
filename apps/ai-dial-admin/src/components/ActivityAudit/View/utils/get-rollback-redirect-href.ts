import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityViewTab } from '@/src/utils/tabs/utils';

export const getRollbackRedirectHref = (entityType?: ActivityAuditResourceType, resourceId?: string) => {
  if (!entityType || !resourceId) {
    return ApplicationRoute.ActivityAudit;
  }

  let redirectHref = '';
  switch (entityType) {
    case ActivityAuditResourceType.MODEL:
      redirectHref = `${ApplicationRoute.Models}/${encodeURIComponent(resourceId)}?tab=${EntityViewTab.Audit}&subtab=${EntityViewTab.Activities}`;
      break;
    case ActivityAuditResourceType.APPLICATION:
      redirectHref = `${ApplicationRoute.Applications}/${encodeURIComponent(resourceId)}?tab=${EntityViewTab.Audit}&subtab=${EntityViewTab.Activities}`;
      break;
    case ActivityAuditResourceType.TOOLSET:
      redirectHref = `${ApplicationRoute.Toolsets}/${encodeURIComponent(resourceId)}?tab=${EntityViewTab.Audit}&subtab=${EntityViewTab.Activities}`;
      break;
    case ActivityAuditResourceType.INTERCEPTOR:
      redirectHref = `${ApplicationRoute.Interceptors}/${encodeURIComponent(resourceId)}?tab=${EntityViewTab.Audit}&subtab=${EntityViewTab.Activities}`;
      break;
    case ActivityAuditResourceType.ROUTE:
      redirectHref = `${ApplicationRoute.Routes}/${encodeURIComponent(resourceId)}?tab=${EntityViewTab.Audit}&subtab=${EntityViewTab.Activities}`;
      break;
    case ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA:
      redirectHref = `${ApplicationRoute.ApplicationRunners}/${encodeURIComponent(resourceId)}?tab=${EntityViewTab.Audit}&subtab=${EntityViewTab.Activities}`;
      break;
    case ActivityAuditResourceType.INTERCEPTOR_TEMPLATE:
      redirectHref = `${ApplicationRoute.InterceptorTemplates}/${encodeURIComponent(resourceId)}?tab=${EntityViewTab.Audit}&subtab=${EntityViewTab.Activities}`;
      break;
    case ActivityAuditResourceType.ADAPTER:
      redirectHref = `${ApplicationRoute.Adapters}/${encodeURIComponent(resourceId)}?tab=${EntityViewTab.Audit}&subtab=${EntityViewTab.Activities}`;
      break;
    case ActivityAuditResourceType.ROLE:
      redirectHref = `${ApplicationRoute.Roles}/${encodeURIComponent(resourceId)}?tab=${EntityViewTab.Audit}&subtab=${EntityViewTab.Activities}`;
      break;
    case ActivityAuditResourceType.KEY:
      redirectHref = `${ApplicationRoute.Keys}/${encodeURIComponent(resourceId)}?tab=${EntityViewTab.Audit}&subtab=${EntityViewTab.Activities}`;
      break;
    default:
      redirectHref = ApplicationRoute.ActivityAudit;
  }

  return redirectHref;
};
