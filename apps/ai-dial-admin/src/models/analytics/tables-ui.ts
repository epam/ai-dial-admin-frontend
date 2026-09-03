import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { PartitionGranularity } from '@/src/models/analytics/table';

export interface ColumnRow {
  id: string;
  source_name: string;
  name: string;
  type: AnalyticsFieldType;
  element_type: AnalyticsFieldType | '';
  // Always an array — empty for every type but Enum, so the editor never has to distinguish "no values
  // collected" from "not an enum row".
  enum_values: string[];
  tag: string;
  display_name: string;
  description: string;
  nullable: boolean;
  sensitive: boolean;
}

export interface ColumnRowError {
  source_name?: string;
  name?: string;
  tag?: string;
  display_name?: string;
  description?: string;
  element_type?: string;
  // One message for the list as a whole: the popup renders its own per-entry messages, and this is what
  // labels the collapsed field and disables Save.
  enum_values?: string;
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

export interface CreateTableForm {
  name: string;
  description: string;
  sourceTable: string;
}

export interface DraftSchemaForm {
  columns: ColumnRow[];
  orderingKey: string[];
  partitionColumn: string;
  granularity: PartitionGranularity | '';
  grainKey: string;
  identityColumn: string;
  versionColumn: string;
}
