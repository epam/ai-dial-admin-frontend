import { DeploymentExportEntityType } from '@/src/types/deployments/export';
import { EntityType } from '@/src/types/entity-type';

export const DEPLOYMENT_IMAGE_DEP = {
  MCP: 'MCP_IMAGE',
  INTERCEPTOR: 'INTERCEPTOR_IMAGE',
  ADAPTER: 'ADAPTER_IMAGE',
} as const;

export const getAllAvailableDependencies = (type?: EntityType, isCore?: boolean): EntityType[] => {
  if (type === EntityType.ROLE) {
    return [
      EntityType.MODEL,
      EntityType.APPLICATION,
      EntityType.TOOLSET,
      EntityType.ROUTE,
      EntityType.APPLICATION_TYPE_SCHEMA,
      EntityType.INTERCEPTOR,
    ];
  }
  if (type === EntityType.KEY) {
    return [
      EntityType.ROLE,
      EntityType.MODEL,
      EntityType.APPLICATION,
      EntityType.APPLICATION_TYPE_SCHEMA,
      EntityType.INTERCEPTOR,
    ];
  }

  if (type === EntityType.MODEL) {
    return isCore ? [EntityType.INTERCEPTOR] : [EntityType.ADAPTER, EntityType.INTERCEPTOR];
  }

  if (type === EntityType.APPLICATION) {
    return [EntityType.APPLICATION_TYPE_SCHEMA, EntityType.INTERCEPTOR];
  }

  if (type === EntityType.APPLICATION_TYPE_SCHEMA) {
    return [EntityType.INTERCEPTOR];
  }

  if (type === (DeploymentExportEntityType.MCP_CONTAINER as string)) {
    return [DEPLOYMENT_IMAGE_DEP.MCP as unknown as EntityType];
  }

  if (type === (DeploymentExportEntityType.INTERCEPTOR_CONTAINER as string)) {
    return [DEPLOYMENT_IMAGE_DEP.INTERCEPTOR as unknown as EntityType];
  }

  if (type === (DeploymentExportEntityType.ADAPTER_CONTAINER as string)) {
    return [DEPLOYMENT_IMAGE_DEP.ADAPTER as unknown as EntityType];
  }

  return [];
};
