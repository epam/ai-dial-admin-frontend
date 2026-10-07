import { CatalogImportAction, CatalogImportOutcome, CatalogImportStatus } from '@/src/types/analytics/import';

/**
 * One object of the bundle as the import sees it. `prev` is the existing object in bundle shape (absent when there is
 * none) and `next` the bundle's; `armable` and `arm_problems` are pipelines only; `status` is on an import result only.
 */
export interface CatalogImportEntry {
  name: string;
  import_action: CatalogImportAction;
  prev?: object | null;
  next?: object | null;
  differs?: boolean | null;
  metadata_only?: boolean | null;
  problems?: string[];
  armable?: boolean | null;
  arm_problems?: string[];
  reused_name?: boolean | null;
  status?: CatalogImportStatus;
}

/** A value the bundle copied from the source environment that is likely wrong on this one. */
export interface CatalogEnvSpecificValue {
  type: string;
  name: string;
  field: string;
  value: string;
}

export interface CatalogImportPreview {
  required_system_tables: CatalogImportEntry[];
  tables: CatalogImportEntry[];
  pipelines: CatalogImportEntry[];
  env_specific: CatalogEnvSpecificValue[];
  validation_errors: string[];
}

export interface CatalogImportResult {
  import_id: string;
  outcome: CatalogImportOutcome;
  required_system_tables: CatalogImportEntry[];
  tables: CatalogImportEntry[];
  pipelines: CatalogImportEntry[];
  env_specific: CatalogEnvSpecificValue[];
}
