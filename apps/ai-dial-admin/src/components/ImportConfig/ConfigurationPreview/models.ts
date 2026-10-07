import { CatalogImportEntry } from '@/src/models/analytics/catalog-import';

/** A preview or result entry flattened for the grid; `entry` keeps the service's object for Compare. */
export interface AnalyticsImportRow {
  name: string;
  action: string;
  problems: string;
  canEnable?: string;
  differs?: string;
  status?: string;
  isInvalid: boolean;
  entry: CatalogImportEntry;
}
