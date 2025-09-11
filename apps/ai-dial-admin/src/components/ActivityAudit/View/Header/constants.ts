import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { ApplicationRoute } from '@/src/types/routes';

export const auditResourceRoute: Record<ActivityAuditResourceType, ApplicationRoute> = {
  [ActivityAuditResourceType.MODEL]: ApplicationRoute.Models,
  [ActivityAuditResourceType.APPLICATION]: ApplicationRoute.Applications,
  [ActivityAuditResourceType.ADAPTER]: ApplicationRoute.Adapters,
  [ActivityAuditResourceType.INTERCEPTOR]: ApplicationRoute.Interceptors,
  [ActivityAuditResourceType.KEY]: ApplicationRoute.Keys,
  [ActivityAuditResourceType.ROLE]: ApplicationRoute.Roles,
  [ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA]: ApplicationRoute.ApplicationRunners,
  [ActivityAuditResourceType.ROUTE]: ApplicationRoute.Routes,
  [ActivityAuditResourceType.INTERCEPTOR_TEMPLATE]: ApplicationRoute.InterceptorTemplates,
  [ActivityAuditResourceType.TOOLSETS]: ApplicationRoute.Toolsets,
};

export const routeAuditResource: Partial<Record<ApplicationRoute, ActivityAuditResourceType>> = {
  [ApplicationRoute.Models]: ActivityAuditResourceType.MODEL,
  [ApplicationRoute.Applications]: ActivityAuditResourceType.APPLICATION,
  [ApplicationRoute.Adapters]: ActivityAuditResourceType.ADAPTER,
  [ApplicationRoute.Interceptors]: ActivityAuditResourceType.INTERCEPTOR,
  [ApplicationRoute.Keys]: ActivityAuditResourceType.KEY,
  [ApplicationRoute.Roles]: ActivityAuditResourceType.ROLE,
  [ApplicationRoute.ApplicationRunners]: ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA,
  [ApplicationRoute.Routes]: ActivityAuditResourceType.ROUTE,
  [ApplicationRoute.InterceptorTemplates]: ActivityAuditResourceType.INTERCEPTOR_TEMPLATE,
  [ApplicationRoute.Toolsets]: ActivityAuditResourceType.TOOLSET,
};
