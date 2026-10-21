import { AnalyticsExportEntityType } from '@/src/types/analytics/export';
import { DeploymentExportEntityType } from '@/src/types/deployments/export';
import { EntityType } from '@/src/types/entity-type';
import { DEPLOYMENT_IMAGE_DEP } from '@/src/utils/entities/get-export-deps';

/**
 * Anything the export tree labels: a core entity, a deployment-export entity, an Analytics export entity, or
 * one of the image dependencies. `entityTypeToMenuKey` is keyed by all of them, and
 * `getAllAvailableDependencies` already returns image-dep strings, so a signature naming only `EntityType`
 * forces every caller to cast.
 */
export type ExportEntityKey = EntityType | DeploymentExportEntityType | AnalyticsExportEntityType | DeploymentImageDep;

type DeploymentImageDep = (typeof DEPLOYMENT_IMAGE_DEP)[keyof typeof DEPLOYMENT_IMAGE_DEP];

export enum ExportType {
  Full = 'full',
  Custom = 'custom',
}

export enum ExportFormat {
  CORE = 'CORE',
  ADMIN = 'ADMIN',
  ACTIVE_CONFIG = 'ACTIVE_CONFIG',
}

export enum ExportComponentType {
  ADMIN = 'admin',
  DEPLOYMENTS = 'deployments',
  ANALYTICS = 'analytics',
}
