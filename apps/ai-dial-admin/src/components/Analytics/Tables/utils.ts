import {
  ANALYTICS_DESCRIPTION_MAX_LENGTH,
  ANALYTICS_DISPLAY_NAME_MAX_LENGTH,
  ANALYTICS_TAG_MAX_LENGTH,
  PARTITION_NONE,
} from '@/src/constants/analytics/tables';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { ApplicationRoute } from '@/src/types/routes';
import {
  AnalyticsColumnMetadataUpdate,
  AnalyticsSchemaPatch,
  AnalyticsTable,
  AnalyticsTableColumn,
  AnalyticsTableType,
  Cardinality,
  DraftSchemaDto,
  TableWriteMode,
} from '@/src/models/analytics/table';
import {
  ColumnEditValues,
  ColumnRow,
  ColumnRowError,
  CreateTableForm,
  DraftSchemaForm,
  ExistingColumnNames,
  KeySelections,
} from '@/src/models/analytics/tables-ui';
import {
  getAnalyticsEnumValuesError,
  getAnalyticsIdentifierError,
  getAnalyticsLengthError,
} from '@/src/utils/validation/analytics-table-error';

type Translate = (key: string, args?: Record<string, string | number>) => string;

export const tableDetailHref = (name: string): string =>
  `${ApplicationRoute.AnalyticsTables}/${encodeURIComponent(name)}`;

let counter = 0;
export const nextColumnId = (): string => `col-${++counter}`;

// The backend rejects a nullable column of these types, so the editors never offer the flag for them.
export const isNullableLockedType = (type: AnalyticsFieldType): boolean =>
  type === AnalyticsFieldType.Array || type === AnalyticsFieldType.Object;

export const createColumnRow = (): ColumnRow => ({
  id: nextColumnId(),
  source_name: '',
  name: '',
  type: AnalyticsFieldType.String,
  element_type: '',
  enum_values: [],
  tag: '',
  display_name: '',
  description: '',
  nullable: false,
  sensitive: false,
});

const collectColumnNames = (columns: ColumnRow[], isEligible: (column: ColumnRow) => boolean): string[] => {
  const seen = new Set<string>();
  columns.forEach((c) => {
    const s = c.source_name.trim();
    if (s && isEligible(c)) seen.add(s);
  });
  return [...seen];
};

const isKeyableRow = (c: ColumnRow): boolean => !c.nullable && c.type !== AnalyticsFieldType.Object;

const isTemporalRow = (c: ColumnRow): boolean =>
  c.type === AnalyticsFieldType.Date || c.type === AnalyticsFieldType.Timestamp;

export const getOrderingKeyColumnNames = (columns: ColumnRow[]): string[] => collectColumnNames(columns, isKeyableRow);

export const getPartitionColumnNames = (columns: ColumnRow[]): string[] =>
  collectColumnNames(columns, (c) => isTemporalRow(c) && !c.nullable);

export const getIdentityColumnNames = (columns: ColumnRow[]): string[] =>
  collectColumnNames(columns, (c) => !c.nullable && !c.sensitive);

export const getVersionColumnNames = (columns: ColumnRow[]): string[] =>
  collectColumnNames(columns, (c) => !c.nullable && !c.sensitive && c.type === AnalyticsFieldType.Timestamp);

export const getGrainKeyColumnNames = (columns: AnalyticsTableColumn[]): string[] =>
  columns.filter((c) => c.type !== AnalyticsFieldType.Object).map((c) => c.source_name);

// Neither end of a rename is followed when another row shares it: the old name may still be that row's, and
// the new one already is.
const getRenames = (prevRows: ColumnRow[], nextRows: ColumnRow[]): Map<string, string> => {
  const prevNames = new Map(prevRows.map((r) => [r.id, r.source_name.trim()]));
  const nextNameCounts = new Map<string, number>();
  nextRows.forEach((r) => {
    const name = r.source_name.trim();
    nextNameCounts.set(name, (nextNameCounts.get(name) ?? 0) + 1);
  });
  const renames = new Map<string, string>();
  nextRows.forEach((row) => {
    const prev = prevNames.get(row.id);
    const next = row.source_name.trim();
    if (prev && prev !== next && !nextNameCounts.has(prev) && (nextNameCounts.get(next) ?? 0) <= 1) {
      renames.set(prev, next);
    }
  });
  return renames;
};

// A renamed column's selections follow it to the new name (a blank name carries nothing); whatever a field no
// longer accepts is dropped.
export const reconcileKeySelections = (
  prevRows: ColumnRow[],
  nextRows: ColumnRow[],
  selections: KeySelections,
): KeySelections => {
  const renames = getRenames(prevRows, nextRows);
  const follow = (name: string): string => renames.get(name) ?? name;
  const keepIfEligible = (name: string, eligible: string[]): string =>
    eligible.includes(follow(name)) ? follow(name) : '';

  const orderingEligible = getOrderingKeyColumnNames(nextRows);
  const partitionColumn = keepIfEligible(selections.partitionColumn, getPartitionColumnNames(nextRows));

  return {
    orderingKey: [...new Set(selections.orderingKey.map(follow))].filter((k) => orderingEligible.includes(k)),
    partitionColumn,
    granularity: selections.partitionColumn && !partitionColumn ? '' : selections.granularity,
    identityColumn: keepIfEligible(selections.identityColumn, getIdentityColumnNames(nextRows)),
    versionColumn: keepIfEligible(selections.versionColumn, getVersionColumnNames(nextRows)),
  };
};

export const createTableForm = (tables: AnalyticsTable[]): CreateTableForm => {
  const firstSource = tables.find((tbl) => tbl.type === AnalyticsTableType.Source);
  return {
    name: '',
    description: '',
    sourceTable: firstSource?.name ?? '',
    write: TableWriteMode.Append,
  };
};

const toColumnRows = (columns: AnalyticsTableColumn[]): ColumnRow[] =>
  columns.map((c) => ({
    id: nextColumnId(),
    source_name: c.source_name,
    name: c.name,
    type: c.type,
    element_type: c.element_type ?? '',
    enum_values: c.enum_values ?? [],
    tag: c.tag ?? '',
    display_name: c.display_name ?? '',
    description: c.description ?? '',
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
  identityColumn: table.identity_column ?? '',
  versionColumn: table.version_column ?? '',
});

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

    const displayNameError = getAnalyticsLengthError(row.display_name, ANALYTICS_DISPLAY_NAME_MAX_LENGTH, t);
    if (displayNameError) error.display_name = displayNameError.text;

    const descriptionError = getAnalyticsLengthError(row.description, ANALYTICS_DESCRIPTION_MAX_LENGTH, t);
    if (descriptionError) error.description = descriptionError.text;

    if (row.type === AnalyticsFieldType.Array && !row.element_type) {
      error.element_type = t(ErrorI18nKey.RequiredField);
    }

    if (row.type === AnalyticsFieldType.Enum) {
      const enumValuesError = getAnalyticsEnumValuesError(row.enum_values, t);
      if (enumValuesError) error.enum_values = enumValuesError.text;
    }

    return error;
  });
};

export const hasColumnRowErrors = (errors: ColumnRowError[]): boolean =>
  errors.some(
    (e) => e.source_name || e.name || e.tag || e.display_name || e.description || e.element_type || e.enum_values,
  );

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
  column.source_name === table.partition_by?.column ||
  Boolean(table.ordering_key?.includes(column.source_name));

export const isScanMetadataColumn = (table: AnalyticsTable, column: AnalyticsTableColumn): boolean =>
  column.source_name === table.identity_column || column.source_name === table.version_column;

export const isDropRestrictedColumn = (table: AnalyticsTable, column: AnalyticsTableColumn): boolean =>
  isScanMetadataColumn(table, column) ||
  column.source_name === table.partition_by?.column ||
  Boolean(table.ordering_key?.includes(column.source_name));

export const toTableColumns = (rows: ColumnRow[]): AnalyticsTableColumn[] =>
  rows
    .filter((r) => r.source_name.trim() && r.name.trim())
    .map((r) => {
      const isArray = r.type === AnalyticsFieldType.Array;
      const isEnum = r.type === AnalyticsFieldType.Enum;
      return {
        source_name: r.source_name.trim(),
        name: r.name.trim(),
        type: r.type,
        nullable: isNullableLockedType(r.type) ? false : r.nullable,
        ...(isArray && r.element_type ? { element_type: r.element_type } : {}),
        // Gated on the type, so retyping a row cannot leak a domain it no longer has. Trimmed here because
        // the service stores them trimmed — sending the untrimmed spelling would make two values it treats
        // as equal look distinct in the request.
        ...(isEnum && r.enum_values.length ? { enum_values: r.enum_values.map((v) => v.trim()) } : {}),
        ...(r.tag.trim() ? { tag: r.tag.trim() } : {}),
        ...(r.display_name.trim() ? { display_name: r.display_name.trim() } : {}),
        ...(r.description.trim() ? { description: r.description.trim() } : {}),
        ...(r.sensitive ? { sensitive: true } : {}),
      };
    });

// The schema body a draft's column-by-column surface would submit. Pure and callable on *any* form, not
// just the live one, so the same builder can be applied to a freshly seeded baseline form and the two
// DTOs compared — which is how `useDraftSchemaForm` decides `isChanged`. Comparing the forms themselves
// cannot work: `createDraftSchemaForm` mints a new `ColumnRow.id` on every call, so a re-derived
// baseline form never deep-equals the live one (design.md D9).
export const buildDraftSchemaDto = (form: DraftSchemaForm, type: AnalyticsTableType): DraftSchemaDto => {
  const columns = toTableColumns(form.columns);

  if (type !== AnalyticsTableType.Source) {
    return {
      columns,
      ...(form.grainKey.trim() ? { grain_key: form.grainKey.trim() } : {}),
      cardinality: Cardinality.ZeroOrOne,
    };
  }

  const orderingNames = getOrderingKeyColumnNames(form.columns);
  const orderingKey = form.orderingKey.filter((k) => orderingNames.includes(k));

  return {
    columns,
    ...(orderingKey.length ? { ordering_key: orderingKey } : {}),
    ...(form.partitionColumn && form.granularity && getPartitionColumnNames(form.columns).includes(form.partitionColumn)
      ? { partition_by: { column: form.partitionColumn, granularity: form.granularity } }
      : {}),
    ...(form.identityColumn && getIdentityColumnNames(form.columns).includes(form.identityColumn)
      ? { identity_column: form.identityColumn }
      : {}),
    ...(form.versionColumn && getVersionColumnNames(form.columns).includes(form.versionColumn)
      ? { version_column: form.versionColumn }
      : {}),
  };
};

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

// A one-row starting point for the write-rows JSON editor: every declared column's *source* name as a
// key (the backend's row-insert endpoint is keyed by the physical ClickHouse column, not the exposed
// name a rename may have since diverged from) with a type-appropriate empty value, so the user edits
// values in place rather than typing the row shape from scratch. An enrichment table's grain key is a
// hidden column — never part of `columns` — but the backend still requires it in each row to identify
// which entity the enrichment data attaches to, so it's added as a leading field when present.
export const buildRowsTemplate = (columns: AnalyticsTableColumn[], grainKey?: string): string => {
  const row: Record<string, unknown> = {};
  if (grainKey) row[grainKey] = '';
  columns.forEach((c) => {
    row[c.source_name] = templateValueFor(c.type);
  });
  return JSON.stringify([row], null, 2);
};

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
