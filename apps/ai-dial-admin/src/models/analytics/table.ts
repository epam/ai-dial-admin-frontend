import { AnalyticsFieldType } from '@/src/models/analytics/entity';

export enum AnalyticsTableType {
  Source = 'source',
  Enrichment = 'enrichment',
}

export enum PartitionGranularity {
  Day = 'day',
  Month = 'month',
  Year = 'year',
}

export interface AnalyticsTableColumn {
  source_name: string;
  name: string;
  type: AnalyticsFieldType;
  nullable?: boolean;
  tag?: string;
  display_name?: string;
  description?: string;
  sensitive?: boolean;
}

export interface AnalyticsTablePartition {
  column: string;
  granularity: PartitionGranularity;
}

export interface AnalyticsTableGrain {
  grain_key: string;
  source_table?: string;
}

// The calling identity's effective per-table permissions, reported by the data-access service on the
// table read surfaces: `write` — may insert rows; `modify` — may change schema/description. The two are
// independent. A system table reports both false for every caller; in `none` security mode both are true.
export interface TablePermissions {
  write: boolean;
  modify: boolean;
}

export interface AnalyticsTable {
  name: string;
  description?: string;
  status?: string;
  system?: boolean;
  type: AnalyticsTableType;
  columns?: AnalyticsTableColumn[];
  grain?: AnalyticsTableGrain;
  ordering_key?: string[];
  partition_by?: AnalyticsTablePartition;
  permissions?: TablePermissions;
}

// A table's role-based access lists: raw provider role names permitted to write (insert rows) and to
// modify (change schema/description). Managed via the admin-only access endpoint.
export interface TableAccess {
  write: string[];
  modify: string[];
}

export interface CreateSourceTableDto {
  name: string;
  description?: string;
  type: AnalyticsTableType.Source;
  columns: AnalyticsTableColumn[];
  ordering_key?: string[];
  partition_by?: AnalyticsTablePartition;
}

export interface CreateEnrichmentTableDto {
  name: string;
  description?: string;
  type: AnalyticsTableType.Enrichment;
  source_table: string;
  grain_key: string;
}

export type CreateTableDto = CreateSourceTableDto | CreateEnrichmentTableDto;

export interface AnalyticsColumnRename {
  from: string;
  to: string;
}

// Per-column metadata merge-patch: an omitted field leaves that attribute unchanged, a blank string
// clears it, and a non-blank string sets it; `sensitive` (omitted → unchanged, true/false → set) is
// typed for contract completeness but never populated by the UI.
export interface AnalyticsColumnMetadataUpdate {
  name: string;
  tag?: string;
  display_name?: string;
  description?: string;
  sensitive?: boolean;
}

export interface AnalyticsSchemaPatch {
  add?: AnalyticsTableColumn[];
  drop?: string[];
  rename?: AnalyticsColumnRename[];
  update?: AnalyticsColumnMetadataUpdate[];
}

export interface WriteRowsDto {
  rows: Array<Record<string, unknown>>;
}
