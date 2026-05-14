import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { IMAGE_TYPE } from '@/src/types/deployments/images';
import { EntityType } from '@/src/types/entity-type';
import { ApplicationRoute } from '@/src/types/routes';

export const auditResourceRoute: Partial<Record<ActivityAuditResourceType, ApplicationRoute>> = {
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
  [ActivityAuditResourceType.ADAPTER_IMAGE_DEFINITION]: ApplicationRoute.Images,
  [ActivityAuditResourceType.APPLICATION_IMAGE_DEFINITION]: ApplicationRoute.Images,
  [ActivityAuditResourceType.INTERCEPTOR_IMAGE_DEFINITION]: ApplicationRoute.Images,
  [ActivityAuditResourceType.MCP_IMAGE_DEFINITION]: ApplicationRoute.Images,
  [ActivityAuditResourceType.MCP_DEPLOYMENT]: ApplicationRoute.McpContainers,
  [ActivityAuditResourceType.ADAPTER_DEPLOYMENT]: ApplicationRoute.AdapterContainers,
  [ActivityAuditResourceType.APPLICATION_DEPLOYMENT]: ApplicationRoute.ApplicationContainers,
  [ActivityAuditResourceType.INTERCEPTOR_DEPLOYMENT]: ApplicationRoute.InterceptorContainers,
  [ActivityAuditResourceType.NIM_DEPLOYMENT]: ApplicationRoute.ModelServings,
  [ActivityAuditResourceType.INFERENCE_DEPLOYMENT]: ApplicationRoute.ModelServings,
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

export const CONTAINER_TYPE_TO_AUDIT: Record<CONTAINER_TYPE, ActivityAuditResourceType> = {
  [CONTAINER_TYPE.MCP]: ActivityAuditResourceType.MCP_DEPLOYMENT,
  [CONTAINER_TYPE.NIM]: ActivityAuditResourceType.NIM_DEPLOYMENT,
  [CONTAINER_TYPE.HF]: ActivityAuditResourceType.INFERENCE_DEPLOYMENT,
  [CONTAINER_TYPE.ADAPTER]: ActivityAuditResourceType.ADAPTER_DEPLOYMENT,
  [CONTAINER_TYPE.APPLICATION]: ActivityAuditResourceType.APPLICATION_DEPLOYMENT,
  [CONTAINER_TYPE.INTERCEPTOR]: ActivityAuditResourceType.INTERCEPTOR_DEPLOYMENT,
};

export const IMAGE_TYPE_TO_AUDIT: Record<IMAGE_TYPE, ActivityAuditResourceType> = {
  [IMAGE_TYPE.MCP]: ActivityAuditResourceType.MCP_IMAGE_DEFINITION,
  [IMAGE_TYPE.INTERCEPTOR]: ActivityAuditResourceType.INTERCEPTOR_IMAGE_DEFINITION,
  [IMAGE_TYPE.ADAPTER]: ActivityAuditResourceType.ADAPTER_IMAGE_DEFINITION,
  [IMAGE_TYPE.APPLICATION]: ActivityAuditResourceType.APPLICATION_IMAGE_DEFINITION,
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
