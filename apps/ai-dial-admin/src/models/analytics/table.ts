// Analytics 2.0 — table definitions, create/enrichment payloads, schema patches and row writes.
// Mirrors the analytics-data-access-service `/v1/tables` demo.

import { AnalyticsFieldType } from '@/src/models/analytics/entity';

export enum AnalyticsTableType {
  Source = 'source',
  Enrichment = 'enrichment',
}

export interface AnalyticsTableColumn {
  source_name: string;
  name: string;
  type: AnalyticsFieldType;
  nullable?: boolean;
  tag?: string;
}

export interface AnalyticsTablePartition {
  column: string;
  granularity: string;
}

export interface AnalyticsTableGrain {
  grain_key: string;
  source_table?: string;
}

export interface AnalyticsTable {
  name: string;
  description?: string;
  type: AnalyticsTableType;
  columns?: AnalyticsTableColumn[];
  grain?: AnalyticsTableGrain;
  ordering_key?: string[];
  partition_by?: AnalyticsTablePartition;
}

// Create payloads (POST /v1/tables) — discriminated on `type`.
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

// Schema patch (PATCH /v1/tables/{name}/schema).
export interface AnalyticsColumnRename {
  from: string;
  to: string;
}

export interface AnalyticsColumnRetag {
  name: string;
  tag: string;
}

export interface AnalyticsSchemaPatch {
  add?: AnalyticsTableColumn[];
  drop?: string[];
  rename?: AnalyticsColumnRename[];
  retag?: AnalyticsColumnRetag[];
}

// Row writes (POST /v1/tables/{name}/rows).
export interface WriteRowsDto {
  rows: Array<Record<string, unknown>>;
}

export interface WriteRowsResult {
  inserted: number;
}
