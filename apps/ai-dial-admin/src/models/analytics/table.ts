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

export interface AnalyticsSchemaPatch {
  add?: AnalyticsTableColumn[];
  drop?: string[];
  rename?: AnalyticsColumnRename[];
  retag?: AnalyticsColumnRetag[];
}

export interface WriteRowsDto {
  rows: Array<Record<string, unknown>>;
}
