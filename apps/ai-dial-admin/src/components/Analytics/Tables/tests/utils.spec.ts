import { describe, expect, test } from 'vitest';

import {
  buildColumnEditPatch,
  createColumnRow,
  getColumnRowErrors,
  hasColumnRowErrors,
  isRenameRestricted,
  toTableColumns,
} from '@/src/components/Analytics/Tables/utils';
import { ErrorI18nKey } from '@/src/constants/i18n';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { AnalyticsTable, AnalyticsTableColumn, AnalyticsTableType } from '@/src/models/analytics/table';
import { ColumnEditValues, ColumnRow } from '@/src/models/analytics/tables-ui';

describe('createColumnRow', () => {
  test('creates a blank row with a unique id and string default type', () => {
    const a = createColumnRow();
    const b = createColumnRow();
    expect(a.id).not.toBe(b.id);
    expect(a).toMatchObject({
      source_name: '',
      name: '',
      type: AnalyticsFieldType.String,
      tag: '',
      nullable: false,
      sensitive: false,
    });
  });
});

describe('toTableColumns', () => {
  test('keeps only rows with both source_name and name, trims, and omits empty tag', () => {
    const rows = [
      {
        id: '1',
        source_name: ' event_id ',
        name: ' event ',
        type: AnalyticsFieldType.Uuid,
        tag: ' identity ',
        nullable: true,
        sensitive: false,
      },
      {
        id: '2',
        source_name: '',
        name: 'skip',
        type: AnalyticsFieldType.String,
        tag: '',
        nullable: false,
        sensitive: false,
      },
      {
        id: '3',
        source_name: 'x',
        name: 'x',
        type: AnalyticsFieldType.Long,
        tag: '',
        nullable: false,
        sensitive: false,
      },
    ];
    expect(toTableColumns(rows)).toEqual([
      { source_name: 'event_id', name: 'event', type: AnalyticsFieldType.Uuid, nullable: true, tag: 'identity' },
      { source_name: 'x', name: 'x', type: AnalyticsFieldType.Long, nullable: false },
    ]);
  });

  test('sensitive rows carry sensitive: true; non-sensitive rows omit the field', () => {
    const rows = [
      {
        id: '1',
        source_name: 'email',
        name: 'email',
        type: AnalyticsFieldType.String,
        tag: '',
        nullable: false,
        sensitive: true,
      },
      {
        id: '2',
        source_name: 'total',
        name: 'total',
        type: AnalyticsFieldType.Decimal,
        tag: '',
        nullable: false,
        sensitive: false,
      },
    ];
    expect(toTableColumns(rows)).toEqual([
      { source_name: 'email', name: 'email', type: AnalyticsFieldType.String, nullable: false, sensitive: true },
      { source_name: 'total', name: 'total', type: AnalyticsFieldType.Decimal, nullable: false },
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
