import { CatalogComponentType } from '@/src/types/analytics/export';

export interface CatalogExportComponent {
  type: CatalogComponentType;
  name: string;
}

export interface CatalogExportRequest {
  components: CatalogExportComponent[];
}

/** One object the bundle will carry. `reason` is `selected` or names the dependency that pulled it in. */
export interface CatalogExportEntry {
  type: CatalogComponentType;
  name: string;
  description?: string;
  reason: string;
}

/** An object the service left out of the bundle — `pending`, `failed`, `otlp`, `unresolvable` or `dependency_skipped`. */
export interface CatalogSkippedObject {
  type: CatalogComponentType;
  name: string;
  reason: string;
}

export interface CatalogExportPreview {
  objects: CatalogExportEntry[];
  required_system_tables: CatalogExportEntry[];
  skipped: CatalogSkippedObject[];
}
