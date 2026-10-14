import { EntitiesI18nKey } from '@/src/constants/i18n';
import { CONTAINER_TYPE } from '@/src/types/deployments/containers';
import { ApplicationRoute } from '@/src/types/routes';

/** Container types served by the unified Containers pages (inference lives in Model Servings). */
export const UNIFIED_CONTAINER_TYPES: CONTAINER_TYPE[] = [
  CONTAINER_TYPE.ADAPTER,
  CONTAINER_TYPE.APPLICATION,
  CONTAINER_TYPE.INTERCEPTOR,
  CONTAINER_TYPE.MCP,
];

export const CONTAINER_TYPE_LABELS: Partial<Record<CONTAINER_TYPE, EntitiesI18nKey>> = {
  [CONTAINER_TYPE.ADAPTER]: EntitiesI18nKey.Adapter,
  [CONTAINER_TYPE.APPLICATION]: EntitiesI18nKey.Application,
  [CONTAINER_TYPE.INTERCEPTOR]: EntitiesI18nKey.Interceptor,
  [CONTAINER_TYPE.MCP]: EntitiesI18nKey.MCP,
};

export const CONTAINER_KIND_BY_TYPE: Partial<Record<CONTAINER_TYPE, ApplicationRoute>> = {
  [CONTAINER_TYPE.ADAPTER]: ApplicationRoute.AdapterContainers,
  [CONTAINER_TYPE.APPLICATION]: ApplicationRoute.ApplicationContainers,
  [CONTAINER_TYPE.INTERCEPTOR]: ApplicationRoute.InterceptorContainers,
  [CONTAINER_TYPE.MCP]: ApplicationRoute.McpContainers,
};

export const isContainerKind = (route?: ApplicationRoute): boolean =>
  !!route && Object.values(CONTAINER_KIND_BY_TYPE).includes(route);
