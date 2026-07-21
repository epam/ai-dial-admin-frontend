import { AnalyticsFieldType } from '@/src/models/analytics/entity';

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
  tag_order?: string[];
}

// POST /v1/tables is identity-only: no columns, no physical keys. The physical schema is defined
// afterwards via the draft-schema resource (see DraftSchemaDto below).
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
