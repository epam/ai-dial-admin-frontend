import { ExportFormat, ExportType } from '@/src/types/export';
import { EntityType } from '@/src/types/entity-type';

export interface ExportDependenciesConfig {
  entities?: boolean;
  roles?: boolean;
  keys?: boolean;
  runners?: boolean;
  interceptors?: boolean;
  prompts?: boolean;
  files?: boolean;
  adapters?: boolean;
}

export interface ExportRequest {
  $type: ExportType;
  exportFormat: ExportFormat;
  addSecrets?: boolean;
  componentTypes: EntityType[];
  components: ExportRequestComponent[];
}

export interface ExportRequestComponent {
  name?: string;
  type: string;
  dependencies: EntityType[];
}
