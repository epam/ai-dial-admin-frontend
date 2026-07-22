import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { PartitionGranularity } from '@/src/models/analytics/table';

export interface ColumnRow {
  id: string;
  source_name: string;
  name: string;
  type: AnalyticsFieldType;
  tag: string;
  nullable: boolean;
  sensitive: boolean;
}

// Per-row validation messages for a ColumnRow; an absent key means that field is valid.
export interface ColumnRowError {
  source_name?: string;
  name?: string;
  tag?: string;
}

// Names already declared on the table an "Add columns" patch targets; new rows must not collide with
// them. Empty for the create-table flow, where no columns exist yet.
export interface ExistingColumnNames {
  sourceNames: string[];
  names: string[];
}

export interface ColumnEditValues {
  name: string;
  display_name: string;
  tag: string;
  description: string;
  sensitive: boolean;
}

export interface TableForm {
  name: string;
  description: string;
  columns: ColumnRow[];
  orderingKey: string[];
  partitionColumn: string;
  granularity: PartitionGranularity | '';
  sourceTable: string;
  grainKey: string;
}
