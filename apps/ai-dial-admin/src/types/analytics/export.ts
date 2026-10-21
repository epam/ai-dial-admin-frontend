/**
 * The Analytics tabs of the Export Config page. Prefixed so a value cannot collide with an `EntityType` or a
 * `DeploymentExportEntityType` in the selection record and the label map the three scopes share.
 */
export enum AnalyticsExportEntityType {
  TABLE = 'analytics-table',
  PIPELINE = 'analytics-pipeline',
}

export enum CatalogComponentType {
  TABLE = 'table',
  PIPELINE = 'pipeline',
}

export enum AnalyticsExportPreviewTab {
  OBJECTS = 'objects',
  REQUIRED_SYSTEM_TABLES = 'required-system-tables',
  SKIPPED = 'skipped',
}
