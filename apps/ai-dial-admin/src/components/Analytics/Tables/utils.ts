import { PARTITION_NONE } from '@/src/constants/analytics/tables';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import {
  AnalyticsSchemaPatch,
  AnalyticsTable,
  AnalyticsTableColumn,
  AnalyticsTableType,
} from '@/src/models/analytics/table';
import { ColumnEditValues, ColumnRow, TableForm } from '@/src/models/analytics/tables-ui';

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

const normalized = (value?: string): string => (value ?? '').trim();

export const buildColumnEditPatch = (
  original: AnalyticsTableColumn,
  edited: ColumnEditValues,
): AnalyticsSchemaPatch | null => {
  const patch: AnalyticsSchemaPatch = {};
  const name = edited.name.trim();
  if (name && name !== original.name) patch.rename = [{ from: original.name, to: name }];
  const target = patch.rename ? name : original.name;
  if (normalized(edited.tag) !== normalized(original.tag)) {
    patch.retag = [{ name: target, tag: normalized(edited.tag) }];
  }
  if (normalized(edited.display_name) !== normalized(original.display_name)) {
    patch.set_display_name = [{ name: target, display_name: normalized(edited.display_name) }];
  }
  if (normalized(edited.description) !== normalized(original.description)) {
    patch.redescribe = [{ name: target, description: normalized(edited.description) }];
  }
  return Object.keys(patch).length ? patch : null;
};

export const isRenameRestricted = (table: AnalyticsTable, column: AnalyticsTableColumn): boolean =>
  column.source_name.startsWith('_') ||
  column.source_name === table.grain?.grain_key ||
  Boolean(table.ordering_key?.includes(column.source_name));

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
