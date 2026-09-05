import { EntitiesI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { ConfigEntityRow } from '@/src/models/dial/config-file';

export enum AnalyticsTableType {
  Source = 'source',
  Enrichment = 'enrichment',
}

export enum TableStatus {
  Pending = 'pending',
  Active = 'active',
  Failed = 'failed',
}

export enum PartitionGranularity {
  Day = 'day',
  Month = 'month',
  Year = 'year',
}

// v1 supports a single cardinality; modeled as an enum for contract completeness even though the UI
// never surfaces a choice (the enrichment draft always sends this value).
export enum Cardinality {
  ZeroOrOne = 'zero_or_one',
}

export interface AnalyticsTableColumn {
  source_name: string;
  name: string;
  type: AnalyticsFieldType;
  // Required when `type` is Array; the array's scalar value type (no nested array/object).
  element_type?: AnalyticsFieldType;
  // Required when `type` is Enum, and rejected on a column of any other type; the closed value set in
  // declared order (see AnalyticsFieldType.Enum). Immutable once the column exists — a schema patch
  // `update` carrying it is rejected rather than ignored, so widening a domain means dropping the column
  // and adding it again.
  enum_values?: string[];
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
  cardinality?: Cardinality;
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
  status?: TableStatus;
  system?: boolean;
  type: AnalyticsTableType;
  source_table?: string;
  columns?: AnalyticsTableColumn[];
  // Exposed-column count; present on list items only (single-get returns `columns` instead).
  column_count?: number;
  grain?: AnalyticsTableGrain;
  ordering_key?: string[];
  partition_by?: AnalyticsTablePartition;
  identity_column?: string;
  version_column?: string;
  tag_order?: string[];
  permissions?: TablePermissions;
}

// A table's role-based access lists: raw provider role names permitted to write (insert rows) and to
// modify (change schema/description). Managed via the admin-only access endpoint.
export interface TableAccess {
  write: string[];
  modify: string[];
}

export interface AnalyticsRoleCatalog {
  roles: ConfigEntityRow[];
  warnings: EntitiesI18nKey[];
}

export interface CreateSourceTableDto {
  name: string;
  type: AnalyticsTableType.Source;
  description?: string;
}

export interface CreateEnrichmentTableDto {
  name: string;
  type: AnalyticsTableType.Enrichment;
  source_table: string;
  description?: string;
}

export type CreateTableDto = CreateSourceTableDto | CreateEnrichmentTableDto;

// Body for POST /v1/tables/{name}/schema (see AnalyticsDataApi.defineTableSchema) — allowed only while
// the table is PENDING/FAILED.
export interface DraftSourceSchemaDto {
  columns: AnalyticsTableColumn[];
  ordering_key?: string[];
  partition_by?: AnalyticsTablePartition;
  identity_column?: string;
  version_column?: string;
}

export interface DraftEnrichmentSchemaDto {
  columns: AnalyticsTableColumn[];
  grain_key?: string;
  cardinality?: Cardinality;
}

export type DraftSchemaDto = DraftSourceSchemaDto | DraftEnrichmentSchemaDto;

// PUT /v1/tables/{name} — table catalog metadata merge-patch: absent/null leaves a field unchanged,
// `tag_order: []` clears it, a non-empty `tag_order` replaces it.
export interface UpdateTableDto {
  description?: string;
  tag_order?: string[];
}

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
