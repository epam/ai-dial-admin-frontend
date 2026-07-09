import { PARTITION_NONE } from '@/src/constants/analytics/tables';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { AnalyticsTable, AnalyticsTableColumn, AnalyticsTableType } from '@/src/models/analytics/table';
import { ColumnRow, TableForm } from '@/src/models/analytics/tables-ui';

let counter = 0;
export const nextColumnId = (): string => `col-${++counter}`;

export const createColumnRow = (): ColumnRow => ({
  id: nextColumnId(),
  source_name: '',
  name: '',
  type: AnalyticsFieldType.String,
  tag: '',
  nullable: false,
});

export const createTableForm = (tables: AnalyticsTable[]): TableForm => {
  const firstSource = tables.find((tbl) => tbl.type === AnalyticsTableType.Source);
  return {
    name: '',
    description: '',
    columns: [createColumnRow()],
    orderingKey: [],
    partitionColumn: '',
    granularity: PARTITION_NONE,
    sourceTable: firstSource?.name ?? '',
    grainKey: firstSource?.ordering_key?.[0] ?? '',
  };
};

export const toTableColumns = (rows: ColumnRow[]): AnalyticsTableColumn[] =>
  rows
    .filter((r) => r.source_name.trim() && r.name.trim())
    .map((r) => ({
      source_name: r.source_name.trim(),
      name: r.name.trim(),
      type: r.type,
      nullable: r.nullable,
      ...(r.tag.trim() ? { tag: r.tag.trim() } : {}),
    }));
