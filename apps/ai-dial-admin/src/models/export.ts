import { ExportFormat, ExportType } from '@/src/types/export';
import { EntityType } from '@/src/types/entity-type';
import { DeploymentExportComponentType } from '@/src/types/deployments/export';

export interface ExportDependenciesConfig {
  models?: boolean;
  applications?: boolean;
  toolSets?: boolean;
  routes?: boolean;
  roles?: boolean;
  keys?: boolean;
  runners?: boolean;
  interceptors?: boolean;
  interceptorsTemplates?: boolean;
  adapters?: boolean;
}

export interface ExportRequest {
  $type: ExportType;
  exportFormat: ExportFormat;
  addSecrets?: boolean;
  componentTypes: EntityType[];
  components: ExportRequestComponent[];
  topics?: string[];
}

export interface ExportRequestComponent {
  name?: string;
  type: string;
  dependencies?: EntityType[];
}

export interface DeploymentExportRequest {
  $type: ExportType;
  addSecrets?: boolean;
  addGlobalImageBuildDomainWhitelist?: boolean;
  components: DeploymentExportComponent[];
}

export interface DeploymentExportComponent {
  name: string;
  type: DeploymentExportComponentType;
}
