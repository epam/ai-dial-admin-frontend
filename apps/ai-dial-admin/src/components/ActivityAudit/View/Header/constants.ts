import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { EntityType } from '@/src/types/entity-type';
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
  [ActivityAuditResourceType.TOOLSET]: ApplicationRoute.Toolsets,
  [ActivityAuditResourceType.SYSTEM_PROPERTIES]: ApplicationRoute.SystemProperties,
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

export const importPreviewResource: Partial<Record<EntityType, ActivityAuditResourceType>> = {
  [EntityType.MODEL]: ActivityAuditResourceType.MODEL,
  [EntityType.TOOLSET]: ActivityAuditResourceType.TOOLSET,
  [EntityType.ROUTE]: ActivityAuditResourceType.ROUTE,
  [EntityType.ROLE]: ActivityAuditResourceType.ROLE,
  [EntityType.KEY]: ActivityAuditResourceType.KEY,
  [EntityType.APPLICATION_TYPE_SCHEMA]: ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA,
  [EntityType.INTERCEPTOR]: ActivityAuditResourceType.INTERCEPTOR,
  [EntityType.INTERCEPTOR_RUNNER]: ActivityAuditResourceType.INTERCEPTOR_TEMPLATE,
  [EntityType.ADAPTER]: ActivityAuditResourceType.ADAPTER,
};
