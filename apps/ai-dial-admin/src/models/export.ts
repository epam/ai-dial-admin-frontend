import { ExportComponentType, ExportFormat, ExportType } from '@/src/types/export';

export interface ExportDependenciesConfig {
  entities?: boolean;
  roles?: boolean;
  keys?: boolean;
  runners?: boolean;
  interceptors?: boolean;
  prompts?: boolean;
  files?: boolean;
}

export interface ExportRequest {
  $type: ExportType;
  exportFormat: ExportFormat;
  addSecrets?: boolean;
  componentTypes: ExportComponentType[];
  components: ExportRequestComponent[];
}

export interface ExportRequestComponent {
  name?: string;
  type: string;
  dependencies: ExportComponentType[];
}
