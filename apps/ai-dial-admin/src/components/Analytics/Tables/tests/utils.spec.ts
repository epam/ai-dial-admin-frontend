import { describe, expect, test } from 'vitest';

import {
  buildColumnEditPatch,
  buildRowsTemplate,
  createColumnRow,
  createDraftSchemaForm,
  createTableForm,
  getColumnRowErrors,
  getIdentityColumnNames,
  getVersionColumnNames,
  hasColumnRowErrors,
  isRenameRestricted,
  isScanMetadataColumn,
  parseRowsJson,
  tableDetailHref,
  toTableColumns,
} from '@/src/components/Analytics/Tables/utils';
import { AnalyticsTablesI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import {
  AnalyticsTable,
  AnalyticsTableColumn,
  AnalyticsTableType,
  PartitionGranularity,
} from '@/src/models/analytics/table';
import { ColumnEditValues, ColumnRow } from '@/src/models/analytics/tables-ui';

describe('createTableForm', () => {
  test('starts blank, defaulting the enrichment source table to the first source in the catalog', () => {
    const tables: AnalyticsTable[] = [
      { name: 'events', type: AnalyticsTableType.Enrichment, source_table: 'orders' },
      { name: 'orders', type: AnalyticsTableType.Source },
    ];
    expect(createTableForm(tables)).toEqual({ name: '', description: '', sourceTable: 'orders' });
  });

  test('has no default source table when the catalog has none', () => {
    expect(createTableForm([])).toEqual({ name: '', description: '', sourceTable: '' });
  });
});

describe('createDraftSchemaForm', () => {
  test('seeds one empty column row when the table has no draft yet', () => {
    const form = createDraftSchemaForm({ name: 'orders', type: AnalyticsTableType.Source });
    expect(form.columns).toHaveLength(1);
    expect(form.columns[0]).toMatchObject({ source_name: '', name: '' });
    expect(form).toMatchObject({ orderingKey: [], partitionColumn: '', granularity: '', grainKey: '' });
  });

  test('seeds from an already-drafted table (columns, ordering key, partition, grain key)', () => {
    const form = createDraftSchemaForm({
      name: 'orders',
      type: AnalyticsTableType.Source,
      columns: [{ source_name: 'ts', name: 'timestamp', type: AnalyticsFieldType.Timestamp, tag: 'time' }],
      ordering_key: ['ts'],
      partition_by: { column: 'ts', granularity: PartitionGranularity.Month },
      grain: { grain_key: 'order_id' },
    });
    expect(form.columns).toEqual([
      expect.objectContaining({ source_name: 'ts', name: 'timestamp', tag: 'time', nullable: false, sensitive: false }),
    ]);
    expect(form.orderingKey).toEqual(['ts']);
    expect(form.partitionColumn).toBe('ts');
    expect(form.granularity).toBe(PartitionGranularity.Month);
    expect(form.grainKey).toBe('order_id');
  });

  // A FAILED table is resubmitted from this seed, so metadata the user already authored must survive the
  // round-trip rather than being silently dropped on retry.
  test('seeds a column display name and description from an already-drafted table', () => {
    const form = createDraftSchemaForm({
      name: 'orders',
      type: AnalyticsTableType.Source,
      columns: [
        {
          source_name: 'total_tokens',
          name: 'total_tokens',
          type: AnalyticsFieldType.Long,
          display_name: 'Total tokens',
          description: 'Prompt plus completion tokens',
        },
      ],
    });
    expect(form.columns[0]).toMatchObject({
      display_name: 'Total tokens',
      description: 'Prompt plus completion tokens',
    });
  });

  test('seeds a column with no stored display name or description as blank strings', () => {
    const form = createDraftSchemaForm({
      name: 'orders',
      type: AnalyticsTableType.Source,
      columns: [{ source_name: 'ts', name: 'ts', type: AnalyticsFieldType.Timestamp }],
    });
    expect(form.columns[0]).toMatchObject({ display_name: '', description: '' });
  });

  test('seeds the scan-metadata pair, which a re-post cannot clear', () => {
    const form = createDraftSchemaForm({
      name: 'orders',
      type: AnalyticsTableType.Source,
      identity_column: 'order_id',
      version_column: 'seen_at',
    });
    expect(form.identityColumn).toBe('order_id');
    expect(form.versionColumn).toBe('seen_at');
  });

  test('leaves the scan-metadata pair empty when the table declares neither', () => {
    const form = createDraftSchemaForm({ name: 'orders', type: AnalyticsTableType.Source });
    expect(form).toMatchObject({ identityColumn: '', versionColumn: '' });
  });
});

const row = (overrides: Partial<ColumnRow>): ColumnRow => ({ ...createColumnRow(), ...overrides });

describe('getIdentityColumnNames / getVersionColumnNames', () => {
  const rows: ColumnRow[] = [
    row({ source_name: 'order_id', name: 'order_id', type: AnalyticsFieldType.Uuid }),
    row({ source_name: 'seen_at', name: 'seen_at', type: AnalyticsFieldType.Timestamp }),
    row({ source_name: 'closed_at', name: 'closed_at', type: AnalyticsFieldType.Timestamp, nullable: true }),
    row({ source_name: 'secret_at', name: 'secret_at', type: AnalyticsFieldType.Timestamp, sensitive: true }),
    row({ source_name: 'event_date', name: 'event_date', type: AnalyticsFieldType.Date }),
    row({ source_name: '  ', name: '  ', type: AnalyticsFieldType.String }),
  ];

  test('identity options exclude nullable, sensitive, and blank rows but allow any type', () => {
    expect(getIdentityColumnNames(rows)).toEqual(['order_id', 'seen_at', 'event_date']);
  });

  test('version options narrow the same set to Timestamp — a Date is rejected by the backend', () => {
    expect(getVersionColumnNames(rows)).toEqual(['seen_at']);
  });

  test('both de-duplicate repeated source names and return empty for no rows', () => {
    const dupes = [
      row({ source_name: 'seen_at', type: AnalyticsFieldType.Timestamp }),
      row({ source_name: 'seen_at', type: AnalyticsFieldType.Timestamp }),
    ];
    expect(getIdentityColumnNames(dupes)).toEqual(['seen_at']);
    expect(getVersionColumnNames(dupes)).toEqual(['seen_at']);
    expect(getIdentityColumnNames([])).toEqual([]);
    expect(getVersionColumnNames([])).toEqual([]);
  });
});

describe('isScanMetadataColumn', () => {
  const table: AnalyticsTable = {
    name: 'orders',
    type: AnalyticsTableType.Source,
    identity_column: 'order_id',
    version_column: 'seen_at',
  };
  const column = (source_name: string, name = source_name): AnalyticsTableColumn => ({
    source_name,
    name,
    type: AnalyticsFieldType.String,
  });

  test('matches either member of the pair', () => {
    expect(isScanMetadataColumn(table, column('order_id'))).toBe(true);
    expect(isScanMetadataColumn(table, column('seen_at'))).toBe(true);
  });

  test('does not match a column outside the pair', () => {
    expect(isScanMetadataColumn(table, column('total'))).toBe(false);
  });

  test('matches on the physical source name, not the exposed name a rename diverged', () => {
    // Renamed: exposed `identifier`, still physically `order_id` — the backend resolves its guards by the
    // physical name, so this must still match.
    expect(isScanMetadataColumn(table, column('order_id', 'identifier'))).toBe(true);
    // The reverse: an unrelated column whose exposed name happens to read like the stored member.
    expect(isScanMetadataColumn(table, column('total', 'order_id'))).toBe(false);
  });

  test('matches nothing when the table declares no pair', () => {
    const bare: AnalyticsTable = { name: 'orders', type: AnalyticsTableType.Source };
    expect(isScanMetadataColumn(bare, column('order_id'))).toBe(false);
  });
});

describe('tableDetailHref', () => {
  test('builds the catalog-relative detail URL, URL-encoding the name', () => {
    expect(tableDetailHref('events')).toBe('/tables/events');
    expect(tableDetailHref('a/b')).toBe('/tables/a%2Fb');
  });
});

describe('createColumnRow', () => {
  test('creates a blank row with a unique id and string default type', () => {
    const a = createColumnRow();
    const b = createColumnRow();
    expect(a.id).not.toBe(b.id);
    expect(a).toMatchObject({
      source_name: '',
      name: '',
      type: AnalyticsFieldType.String,
      element_type: '',
      tag: '',
      display_name: '',
      description: '',
      nullable: false,
      sensitive: false,
    });
  });
});

describe('enum column row validation', () => {
  const t = (key: string) => key;
  const noExisting = { sourceNames: [], names: [] };

  test('an Enum row with no declared values errors and blocks save', () => {
    const errors = getColumnRowErrors(
      [row({ source_name: 'status', name: 'status', type: AnalyticsFieldType.Enum })],
      noExisting,
      t,
    );
    expect(errors[0].enum_values).toBe(AnalyticsTablesI18nKey.EnumValuesRequired);
    expect(hasColumnRowErrors(errors)).toBe(true);
  });

  test('an Enum row with a valid domain has no error', () => {
    const errors = getColumnRowErrors(
      [
        row({
          source_name: 'status',
          name: 'status',
          type: AnalyticsFieldType.Enum,
          enum_values: ['pending', 'failed'],
        }),
      ],
      noExisting,
      t,
    );
    expect(errors[0].enum_values).toBeUndefined();
    expect(hasColumnRowErrors(errors)).toBe(false);
  });

  test('a duplicate after trimming errors', () => {
    const errors = getColumnRowErrors(
      [
        row({
          source_name: 'status',
          name: 'status',
          type: AnalyticsFieldType.Enum,
          enum_values: ['failed', 'failed '],
        }),
      ],
      noExisting,
      t,
    );
    expect(errors[0].enum_values).toBe(AnalyticsTablesI18nKey.EnumValueDuplicate);
  });

  // The rule is required-iff-enum: an empty list on any other type is not an error.
  test('a non-Enum row with no values is not checked', () => {
    const errors = getColumnRowErrors(
      [row({ source_name: 'status', name: 'status', type: AnalyticsFieldType.String })],
      noExisting,
      t,
    );
    expect(errors[0].enum_values).toBeUndefined();
    expect(hasColumnRowErrors(errors)).toBe(false);
  });
});

describe('toTableColumns', () => {
  test('keeps only rows with both source_name and name, trims, and omits empty tag', () => {
    const rows = [
      row({
        source_name: ' event_id ',
        name: ' event ',
        type: AnalyticsFieldType.Uuid,
        tag: ' identity ',
        nullable: true,
      }),
      row({ source_name: '', name: 'skip' }),
      row({ source_name: 'x', name: 'x', type: AnalyticsFieldType.Long }),
    ];
    expect(toTableColumns(rows)).toEqual([
      { source_name: 'event_id', name: 'event', type: AnalyticsFieldType.Uuid, nullable: true, tag: 'identity' },
      { source_name: 'x', name: 'x', type: AnalyticsFieldType.Long, nullable: false },
    ]);
  });

  test('sensitive rows carry sensitive: true; non-sensitive rows omit the field', () => {
    const rows = [
      row({ source_name: 'email', name: 'email', sensitive: true }),
      row({ source_name: 'total', name: 'total', type: AnalyticsFieldType.Decimal }),
    ];
    expect(toTableColumns(rows)).toEqual([
      { source_name: 'email', name: 'email', type: AnalyticsFieldType.String, nullable: false, sensitive: true },
      { source_name: 'total', name: 'total', type: AnalyticsFieldType.Decimal, nullable: false },
    ]);
  });

  test('an Enum row carries its enum_values, trimmed and in the authored order', () => {
    const rows = [
      row({
        source_name: 'status',
        name: 'status',
        type: AnalyticsFieldType.Enum,
        enum_values: ['low', ' medium ', 'high'],
      }),
    ];
    expect(toTableColumns(rows)).toEqual([
      {
        source_name: 'status',
        name: 'status',
        type: AnalyticsFieldType.Enum,
        nullable: false,
        enum_values: ['low', 'medium', 'high'],
      },
    ]);
  });

  // Gated on the type, so a row retyped away from Enum cannot submit a domain it no longer has.
  test('a non-Enum row omits enum_values even when the draft still holds some', () => {
    const rows = [
      row({ source_name: 'status', name: 'status', type: AnalyticsFieldType.String, enum_values: ['low', 'high'] }),
    ];
    expect(toTableColumns(rows)).toEqual([
      { source_name: 'status', name: 'status', type: AnalyticsFieldType.String, nullable: false },
    ]);
  });

  test('an Array row carries its element_type and is forced non-nullable', () => {
    const rows = [
      row({
        source_name: 'tags',
        name: 'tags',
        type: AnalyticsFieldType.Array,
        element_type: AnalyticsFieldType.String,
        nullable: true,
      }),
    ];
    expect(toTableColumns(rows)).toEqual([
      {
        source_name: 'tags',
        name: 'tags',
        type: AnalyticsFieldType.Array,
        nullable: false,
        element_type: AnalyticsFieldType.String,
      },
    ]);
  });

  test('an Array row with no element_type chosen yet omits the field rather than sending an empty value', () => {
    const rows = [row({ source_name: 'tags', name: 'tags', type: AnalyticsFieldType.Array, element_type: '' })];
    expect(toTableColumns(rows)).toEqual([
      { source_name: 'tags', name: 'tags', type: AnalyticsFieldType.Array, nullable: false },
    ]);
  });

  test('carries a filled display name and description, trimmed', () => {
    const rows = [
      row({
        source_name: 'total_tokens',
        name: 'total_tokens',
        type: AnalyticsFieldType.Long,
        display_name: '  Total tokens  ',
        description: '  Prompt plus completion tokens  ',
      }),
    ];
    expect(toTableColumns(rows)).toEqual([
      {
        source_name: 'total_tokens',
        name: 'total_tokens',
        type: AnalyticsFieldType.Long,
        nullable: false,
        display_name: 'Total tokens',
        description: 'Prompt plus completion tokens',
      },
    ]);
  });

  // Blank means "not set" at creation time, so the key is omitted rather than sent as an empty string —
  // unlike the edit modal, where a blank value is the signal that clears a stored one.
  test('omits a blank or whitespace-only display name and description', () => {
    const rows = [
      row({ source_name: 'a', name: 'a', display_name: '', description: '' }),
      row({ source_name: 'b', name: 'b', display_name: '   ', description: '  ' }),
    ];
    expect(toTableColumns(rows)).toEqual([
      { source_name: 'a', name: 'a', type: AnalyticsFieldType.String, nullable: false },
      { source_name: 'b', name: 'b', type: AnalyticsFieldType.String, nullable: false },
    ]);
  });

  test('carries one of the pair when only the other is blank', () => {
    const rows = [row({ source_name: 'a', name: 'a', display_name: 'A value', description: '' })];
    expect(toTableColumns(rows)).toEqual([
      { source_name: 'a', name: 'a', type: AnalyticsFieldType.String, nullable: false, display_name: 'A value' },
    ]);
  });
});

const COLUMN: AnalyticsTableColumn = {
  source_name: 'total_money',
  name: 'total_money',
  type: AnalyticsFieldType.Decimal,
  tag: 'metric',
  display_name: 'Total money',
  description: 'Money spent',
};

const values = (overrides?: Partial<ColumnEditValues>): ColumnEditValues => ({
  name: 'total_money',
  display_name: 'Total money',
  tag: 'metric',
  description: 'Money spent',
  sensitive: false,
  ...overrides,
});

describe('buildColumnEditPatch', () => {
  test('returns null when nothing changed (including whitespace-only differences)', () => {
    expect(buildColumnEditPatch(COLUMN, values())).toBeNull();
    expect(buildColumnEditPatch(COLUMN, values({ display_name: ' Total money ', tag: ' metric ' }))).toBeNull();
  });

  test('single-field metadata diffs produce one update entry carrying only that field', () => {
    expect(buildColumnEditPatch(COLUMN, values({ display_name: 'Total money spend' }))).toEqual({
      update: [{ name: 'total_money', display_name: 'Total money spend' }],
    });
    expect(buildColumnEditPatch(COLUMN, values({ tag: 'cost' }))).toEqual({
      update: [{ name: 'total_money', tag: 'cost' }],
    });
    expect(buildColumnEditPatch(COLUMN, values({ description: 'Money spent on the request' }))).toEqual({
      update: [{ name: 'total_money', description: 'Money spent on the request' }],
    });
  });

  test('a rename-only change produces no update entry', () => {
    expect(buildColumnEditPatch(COLUMN, values({ name: 'total_cost' }))).toEqual({
      rename: [{ from: 'total_money', to: 'total_cost' }],
    });
  });

  test('combined rename + metadata update references the post-rename name', () => {
    expect(buildColumnEditPatch(COLUMN, values({ name: 'total_cost', display_name: 'Total money spend' }))).toEqual({
      rename: [{ from: 'total_money', to: 'total_cost' }],
      update: [{ name: 'total_cost', display_name: 'Total money spend' }],
    });
  });

  test('blank metadata values are sent as the clear signal', () => {
    expect(buildColumnEditPatch(COLUMN, values({ display_name: '', description: '  ' }))).toEqual({
      update: [{ name: 'total_money', display_name: '', description: '' }],
    });
  });

  test('setting metadata on a column without any produces one update entry', () => {
    const bare: AnalyticsTableColumn = { source_name: 'x', name: 'x', type: AnalyticsFieldType.String };
    expect(
      buildColumnEditPatch(bare, { name: 'x', display_name: 'X value', tag: '', description: '', sensitive: false }),
    ).toEqual({
      update: [{ name: 'x', display_name: 'X value' }],
    });
  });

  test('toggling sensitive is diffed into the update entry', () => {
    expect(buildColumnEditPatch(COLUMN, values({ sensitive: true }))).toEqual({
      update: [{ name: 'total_money', sensitive: true }],
    });
    const secret: AnalyticsTableColumn = { ...COLUMN, sensitive: true };
    expect(buildColumnEditPatch(secret, values({ sensitive: false }))).toEqual({
      update: [{ name: 'total_money', sensitive: false }],
    });
  });

  test('sensitive rides along with other changed metadata and the post-rename name', () => {
    expect(buildColumnEditPatch(COLUMN, values({ name: 'total_cost', sensitive: true }))).toEqual({
      rename: [{ from: 'total_money', to: 'total_cost' }],
      update: [{ name: 'total_cost', sensitive: true }],
    });
  });

  test('a blank name never produces a rename op', () => {
    expect(buildColumnEditPatch(COLUMN, values({ name: '  ' }))).toBeNull();
  });
});

describe('getColumnRowErrors / hasColumnRowErrors', () => {
  // Stub t() returns the key so assertions target the i18n key, not translated text.
  const t = (key: string) => key;
  const noExisting = { sourceNames: [], names: [] };
  const row = (overrides: Partial<ColumnRow>): ColumnRow => ({ ...createColumnRow(), ...overrides });

  test('a blank or partial row (missing source_name or name) produces no identifier errors', () => {
    const rows = [row({}), row({ source_name: 'only_source' }), row({ name: 'only_name' })];
    const errors = getColumnRowErrors(rows, noExisting, t);
    expect(errors).toEqual([{}, {}, {}]);
    expect(hasColumnRowErrors(errors)).toBe(false);
  });

  test('fully-declared rows with valid, unique identifiers produce no errors', () => {
    const rows = [row({ source_name: 'event_id', name: 'event' }), row({ source_name: 'total', name: 'total_cost' })];
    expect(hasColumnRowErrors(getColumnRowErrors(rows, noExisting, t))).toBe(false);
  });

  test('flags source_name and name that violate the identifier grammar', () => {
    const errors = getColumnRowErrors([row({ source_name: 'Bad Source', name: 'Bad-Name' })], noExisting, t);
    expect(errors[0].source_name).toBe(ErrorI18nKey.SnakeCaseIdentifier);
    expect(errors[0].name).toBe(ErrorI18nKey.SnakeCaseIdentifier);
  });

  test('flags duplicate names among sibling rows', () => {
    const rows = [row({ source_name: 'a', name: 'dup' }), row({ source_name: 'b', name: 'dup' })];
    const errors = getColumnRowErrors(rows, noExisting, t);
    expect(errors[0].name).toBe(ErrorI18nKey.KeyValueExists);
    expect(errors[1].name).toBe(ErrorI18nKey.KeyValueExists);
  });

  test('flags a row that collides with a pre-existing table column', () => {
    const errors = getColumnRowErrors(
      [row({ source_name: 'new_source', name: 'existing_name' })],
      { sourceNames: [], names: ['existing_name'] },
      t,
    );
    expect(errors[0].name).toBe(ErrorI18nKey.KeyValueExists);
  });

  test('flags a tag longer than the length cap even on an otherwise blank row', () => {
    const errors = getColumnRowErrors([row({ tag: 'a'.repeat(65) })], noExisting, t);
    expect(errors[0].tag).toBe(ErrorI18nKey.Length);
    expect(hasColumnRowErrors(errors)).toBe(true);
  });

  test('flags a display name over its 128-char cap and a description over its 1024-char cap', () => {
    const errors = getColumnRowErrors(
      [row({ display_name: 'a'.repeat(129) }), row({ description: 'b'.repeat(1025) })],
      noExisting,
      t,
    );
    expect(errors[0].display_name).toBe(ErrorI18nKey.Length);
    expect(errors[1].description).toBe(ErrorI18nKey.Length);
    expect(hasColumnRowErrors(errors)).toBe(true);
  });

  test('accepts a display name and description exactly at their caps', () => {
    const errors = getColumnRowErrors(
      [row({ source_name: 'a', name: 'a', display_name: 'a'.repeat(128), description: 'b'.repeat(1024) })],
      noExisting,
      t,
    );
    expect(errors[0].display_name).toBeUndefined();
    expect(errors[0].description).toBeUndefined();
    expect(hasColumnRowErrors(errors)).toBe(false);
  });

  // These two keys are the ones a boolean-OR gate silently forgets: an unlisted key reads as undefined,
  // so the error is computed and then ignored, letting an over-cap value reach the backend as a 422.
  test('reports an error carrying only a display name or only a description', () => {
    expect(hasColumnRowErrors([{ display_name: ErrorI18nKey.Length }])).toBe(true);
    expect(hasColumnRowErrors([{ description: ErrorI18nKey.Length }])).toBe(true);
  });

  test('flags an Array row with no element_type chosen', () => {
    const errors = getColumnRowErrors([row({ type: AnalyticsFieldType.Array, element_type: '' })], noExisting, t);
    expect(errors[0].element_type).toBe(ErrorI18nKey.RequiredField);
    expect(hasColumnRowErrors(errors)).toBe(true);
  });

  test('an Array row with an element_type chosen produces no element_type error', () => {
    const errors = getColumnRowErrors(
      [row({ type: AnalyticsFieldType.Array, element_type: AnalyticsFieldType.String })],
      noExisting,
      t,
    );
    expect(errors[0].element_type).toBeUndefined();
  });

  test('a non-Array row never requires an element_type', () => {
    const errors = getColumnRowErrors([row({ type: AnalyticsFieldType.String, element_type: '' })], noExisting, t);
    expect(errors[0].element_type).toBeUndefined();
  });
});

describe('isRenameRestricted', () => {
  const tableWith = (overrides?: Partial<AnalyticsTable>): AnalyticsTable => ({
    name: 'events',
    type: AnalyticsTableType.Source,
    ...overrides,
  });
  const column = (source_name: string): AnalyticsTableColumn => ({
    source_name,
    name: source_name,
    type: AnalyticsFieldType.String,
  });

  test('system (_-prefixed), grain-key, and ordering-key columns are restricted', () => {
    expect(isRenameRestricted(tableWith(), column('_ingested_at'))).toBe(true);
    expect(isRenameRestricted(tableWith({ grain: { grain_key: 'event_id' } }), column('event_id'))).toBe(true);
    expect(isRenameRestricted(tableWith({ ordering_key: ['request_time'] }), column('request_time'))).toBe(true);
  });

  test('ordinary columns are not restricted', () => {
    expect(isRenameRestricted(tableWith({ ordering_key: ['request_time'] }), column('total_money'))).toBe(false);
  });
});

describe('buildRowsTemplate', () => {
  test('builds a one-row array with each column source_name as a key mapped to a type-appropriate value', () => {
    const columns: AnalyticsTableColumn[] = [
      { source_name: 'event_id', name: 'event', type: AnalyticsFieldType.Uuid },
      { source_name: 'total_money', name: 'total_money', type: AnalyticsFieldType.Decimal },
      { source_name: 'count', name: 'count', type: AnalyticsFieldType.Integer },
      { source_name: 'total', name: 'total', type: AnalyticsFieldType.Long },
      { source_name: 'active', name: 'active', type: AnalyticsFieldType.Boolean },
      { source_name: 'ts', name: 'ts', type: AnalyticsFieldType.Timestamp },
      { source_name: 'meta', name: 'meta', type: AnalyticsFieldType.Object },
      { source_name: 'tags', name: 'tags', type: AnalyticsFieldType.Array, element_type: AnalyticsFieldType.String },
    ];
    expect(JSON.parse(buildRowsTemplate(columns))).toEqual([
      {
        event_id: '',
        total_money: 0,
        count: 0,
        total: 0,
        active: false,
        ts: '',
        meta: {},
        tags: [],
      },
    ]);
  });

  // The write-rows endpoint is keyed by the physical column, so a renamed column's exposed `name` must
  // never leak into the template — only its (unchanging) `source_name` may appear as a key.
  test('keys by source_name, not name, when a column has been renamed since creation', () => {
    const columns: AnalyticsTableColumn[] = [
      { source_name: 'event_id', name: 'renamed_event', type: AnalyticsFieldType.String },
    ];
    const template = JSON.parse(buildRowsTemplate(columns));
    expect(template).toEqual([{ event_id: '' }]);
    expect(template[0]).not.toHaveProperty('renamed_event');
  });

  // An enrichment table's grain key is a hidden column (never part of `columns`) that the backend still
  // requires in each inserted row to identify which entity the enrichment data attaches to.
  test('adds the grain key as a leading field when provided, for an enrichment table', () => {
    const columns: AnalyticsTableColumn[] = [{ source_name: 'flag', name: 'flag', type: AnalyticsFieldType.Boolean }];
    expect(JSON.parse(buildRowsTemplate(columns, 'order_id'))).toEqual([{ order_id: '', flag: false }]);
  });

  test('omits the grain key field when not provided (a source table)', () => {
    const columns: AnalyticsTableColumn[] = [{ source_name: 'flag', name: 'flag', type: AnalyticsFieldType.Boolean }];
    expect(JSON.parse(buildRowsTemplate(columns))).toEqual([{ flag: false }]);
  });

  test('a table with no columns produces a single empty row object', () => {
    expect(JSON.parse(buildRowsTemplate([]))).toEqual([{}]);
  });
});

describe('parseRowsJson', () => {
  test('parses a valid JSON array of row objects', () => {
    expect(parseRowsJson('[{"a": 1}, {"a": 2}]')).toEqual([{ a: 1 }, { a: 2 }]);
  });

  test('returns null for unparseable JSON', () => {
    expect(parseRowsJson('{ "a": ')).toBeNull();
  });

  test('returns null for valid JSON that is not an array', () => {
    expect(parseRowsJson('{"a": 1}')).toBeNull();
  });
});
