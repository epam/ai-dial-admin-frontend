import { PARTITION_NONE } from '@/src/constants/analytics/tables';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import {
  AnalyticsColumnMetadataUpdate,
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
  sensitive: false,
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

  // Merge-patch: include only the metadata fields that changed (blank clears, non-blank sets); an
  // omitted field leaves the attribute unchanged.
  const update: AnalyticsColumnMetadataUpdate = { name: target };
  if (normalized(edited.tag) !== normalized(original.tag)) update.tag = normalized(edited.tag);
  if (normalized(edited.display_name) !== normalized(original.display_name)) {
    update.display_name = normalized(edited.display_name);
  }
  if (normalized(edited.description) !== normalized(original.description)) {
    update.description = normalized(edited.description);
  }
  if (edited.sensitive !== Boolean(original.sensitive)) update.sensitive = edited.sensitive;
  // >1 key means a metadata field changed alongside the always-present `name`.
  if (Object.keys(update).length > 1) patch.update = [update];

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
      ...(r.sensitive ? { sensitive: true } : {}),
    }));
