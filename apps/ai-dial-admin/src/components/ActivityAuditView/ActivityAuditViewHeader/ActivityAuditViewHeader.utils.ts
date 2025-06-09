import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { ApplicationRoute } from '@/src/types/routes';

export const auditResourceRoute: Record<ActivityAuditResourceType, ApplicationRoute> = {
  [ActivityAuditResourceType.MODEL]: ApplicationRoute.Models,
  [ActivityAuditResourceType.APPLICATION]: ApplicationRoute.Applications,
  [ActivityAuditResourceType.ADAPTER]: ApplicationRoute.Adapters,
  [ActivityAuditResourceType.ASSISTANT]: ApplicationRoute.Assistants,
  [ActivityAuditResourceType.INTERCEPTOR]: ApplicationRoute.Interceptors,
  [ActivityAuditResourceType.KEY]: ApplicationRoute.Keys,
  [ActivityAuditResourceType.ROLE]: ApplicationRoute.Roles,
  [ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA]: ApplicationRoute.ApplicationRunners,
  [ActivityAuditResourceType.ADDON]: ApplicationRoute.Addons,
  [ActivityAuditResourceType.ROUTE]: ApplicationRoute.Routes,
};
