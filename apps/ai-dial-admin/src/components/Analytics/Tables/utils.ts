import { ANALYTICS_TAG_MAX_LENGTH, PARTITION_NONE } from '@/src/constants/analytics/tables';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { ApplicationRoute } from '@/src/types/routes';
import {
  AnalyticsColumnMetadataUpdate,
  AnalyticsSchemaPatch,
  AnalyticsTable,
  AnalyticsTableColumn,
  AnalyticsTableType,
} from '@/src/models/analytics/table';
import {
  ColumnEditValues,
  ColumnRow,
  ColumnRowError,
  CreateTableForm,
  DraftSchemaForm,
  ExistingColumnNames,
} from '@/src/models/analytics/tables-ui';
import { getAnalyticsIdentifierError, getAnalyticsLengthError } from '@/src/utils/validation/analytics-table-error';

type Translate = (key: string, args?: Record<string, string | number>) => string;

export const tableDetailHref = (name: string): string =>
  `${ApplicationRoute.AnalyticsTables}/${encodeURIComponent(name)}`;

let counter = 0;
export const nextColumnId = (): string => `col-${++counter}`;

export const createColumnRow = (): ColumnRow => ({
  id: nextColumnId(),
  source_name: '',
  name: '',
  type: AnalyticsFieldType.String,
  element_type: '',
  tag: '',
  nullable: false,
  sensitive: false,
});

export const createTableForm = (tables: AnalyticsTable[]): CreateTableForm => {
  const firstSource = tables.find((tbl) => tbl.type === AnalyticsTableType.Source);
  return {
    name: '',
    description: '',
    sourceTable: firstSource?.name ?? '',
  };
};

const toColumnRows = (columns: AnalyticsTableColumn[]): ColumnRow[] =>
  columns.map((c) => ({
    id: nextColumnId(),
    source_name: c.source_name,
    name: c.name,
    type: c.type,
    element_type: c.element_type ?? '',
    tag: c.tag ?? '',
    nullable: Boolean(c.nullable),
    sensitive: Boolean(c.sensitive),
  }));

// A FAILED table already has its last-submitted schema persisted (only the CREATE TABLE step failed);
// seed from it when present, otherwise start from one empty column row.
export const createDraftSchemaForm = (table: AnalyticsTable): DraftSchemaForm => ({
  columns: table.columns?.length ? toColumnRows(table.columns) : [createColumnRow()],
  orderingKey: table.ordering_key ?? [],
  partitionColumn: table.partition_by?.column ?? '',
  granularity: table.partition_by?.granularity ?? PARTITION_NONE,
  grainKey: table.grain?.grain_key ?? '',
});

// Validates the column rows of a create/add-columns form against the backend rules: each row that will
// actually be sent (both source_name and name filled — partial rows are dropped by toTableColumns) must
// have snake_case identifiers unique within the table (against sibling rows and any pre-existing columns),
// and a tag within its length cap. Returns one entry per row, aligned by index; empty entries are valid.
export const getColumnRowErrors = (
  rows: ColumnRow[],
  existing: ExistingColumnNames,
  t: Translate,
): ColumnRowError[] => {
  const trimmedRows = rows.map((r) => ({ source: r.source_name.trim(), name: r.name.trim() }));

  return rows.map((row, index) => {
    const error: ColumnRowError = {};
    const source = trimmedRows[index].source;
    const name = trimmedRows[index].name;

    if (source && name) {
      const siblingSources = trimmedRows.filter((_, i) => i !== index).map((r) => r.source);
      const siblingNames = trimmedRows.filter((_, i) => i !== index).map((r) => r.name);
      const sourceError = getAnalyticsIdentifierError(source, [...existing.sourceNames, ...siblingSources], t);
      if (sourceError) error.source_name = sourceError.text;
      const nameError = getAnalyticsIdentifierError(name, [...existing.names, ...siblingNames], t);
      if (nameError) error.name = nameError.text;
    }

    const tagError = getAnalyticsLengthError(row.tag, ANALYTICS_TAG_MAX_LENGTH, t);
    if (tagError) error.tag = tagError.text;

    if (row.type === AnalyticsFieldType.Array && !row.element_type) {
      error.element_type = t(ErrorI18nKey.RequiredField);
    }

    return error;
  });
};

export const hasColumnRowErrors = (errors: ColumnRowError[]): boolean =>
  errors.some((e) => e.source_name || e.name || e.tag || e.element_type);

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
    .map((r) => {
      const isArray = r.type === AnalyticsFieldType.Array;
      return {
        source_name: r.source_name.trim(),
        name: r.name.trim(),
        type: r.type,
        // The backend rejects a nullable array column, so an Array row is always sent as non-nullable.
        nullable: isArray ? false : r.nullable,
        ...(isArray && r.element_type ? { element_type: r.element_type } : {}),
        ...(r.tag.trim() ? { tag: r.tag.trim() } : {}),
        ...(r.sensitive ? { sensitive: true } : {}),
      };
    });

// A type-shaped placeholder value for the write-rows template, so the example stays valid JSON for the
// column's actual type instead of always suggesting a string (which the backend would reject for e.g. a
// numeric or array column).
const templateValueFor = (type: AnalyticsFieldType): unknown => {
  switch (type) {
    case AnalyticsFieldType.Integer:
    case AnalyticsFieldType.Long:
    case AnalyticsFieldType.Decimal:
      return 0;
    case AnalyticsFieldType.Boolean:
      return false;
    case AnalyticsFieldType.Object:
      return {};
    case AnalyticsFieldType.Array:
      return [];
    default:
      return '';
  }
};

// A one-row starting point for the write-rows JSON editor: every declared column's name as a key with
// a type-appropriate empty value, so the user edits values in place rather than typing the row shape
// from scratch.
export const buildRowsTemplate = (columns: AnalyticsTableColumn[]): string =>
  JSON.stringify([Object.fromEntries(columns.map((c) => [c.name, templateValueFor(c.type)]))], null, 2);

// The write-rows editor's content is valid only as a JSON array (of row objects); returns null for
// unparseable JSON or a parsed non-array, so callers can both submit-guard and disable Insert on the
// same check.
export const parseRowsJson = (json: string): Record<string, unknown>[] | null => {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as Record<string, unknown>[]) : null;
  } catch {
    return null;
  }
};
