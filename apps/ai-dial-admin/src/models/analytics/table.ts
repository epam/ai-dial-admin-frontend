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
}

export interface AnalyticsTablePartition {
  column: string;
  granularity: PartitionGranularity;
}

export interface AnalyticsTableGrain {
  grain_key: string;
  source_table?: string;
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

export interface AnalyticsColumnRetag {
  name: string;
  tag: string;
}

// Blank display_name/description means "clear the stored value" (backend normalizes blank to null).
export interface AnalyticsColumnSetDisplayName {
  name: string;
  display_name: string;
}

export interface AnalyticsColumnRedescribe {
  name: string;
  description: string;
}

export interface AnalyticsSchemaPatch {
  add?: AnalyticsTableColumn[];
  drop?: string[];
  rename?: AnalyticsColumnRename[];
  retag?: AnalyticsColumnRetag[];
  set_display_name?: AnalyticsColumnSetDisplayName[];
  redescribe?: AnalyticsColumnRedescribe[];
}

export interface WriteRowsDto {
  rows: Array<Record<string, unknown>>;
}
