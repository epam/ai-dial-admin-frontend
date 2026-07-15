import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { PartitionGranularity } from '@/src/models/analytics/table';

export interface ColumnRow {
  id: string;
  source_name: string;
  name: string;
  type: AnalyticsFieldType;
  tag: string;
  nullable: boolean;
}

export interface ColumnEditValues {
  name: string;
  display_name: string;
  tag: string;
  description: string;
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
