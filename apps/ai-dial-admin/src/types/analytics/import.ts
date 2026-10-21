/** How an Analytics import treats an object that already exists. The service has no overwrite. */
export enum CatalogResolutionPolicy {
  FAIL_IF_EXISTS = 'FAIL_IF_EXISTS',
  SKIP_IF_EXISTS = 'SKIP_IF_EXISTS',
}

export enum CatalogImportAction {
  CREATE = 'CREATE',
  SKIP = 'SKIP',
  FAIL = 'FAIL',
}

export enum CatalogImportOutcome {
  COMPLETED = 'completed',
  ROLLED_BACK = 'rolled_back',
  ROLLBACK_FAILED = 'rollback_failed',
}

export enum CatalogImportStatus {
  CREATED = 'created',
  SKIPPED = 'skipped',
  ROLLED_BACK = 'rolled_back',
  ROLLBACK_FAILED = 'rollback_failed',
  FAILED = 'failed',
}

export enum AnalyticsImportPreviewTab {
  TABLES = 'tables',
  PIPELINES = 'pipelines',
  REQUIRED_SYSTEM_TABLES = 'required-system-tables',
}
