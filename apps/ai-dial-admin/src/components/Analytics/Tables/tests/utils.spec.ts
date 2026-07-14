import { describe, expect, test } from 'vitest';

import {
  buildColumnEditPatch,
  createColumnRow,
  isRenameRestricted,
  toTableColumns,
} from '@/src/components/Analytics/Tables/utils';
import { AnalyticsFieldType } from '@/src/models/analytics/entity';
import { AnalyticsTable, AnalyticsTableColumn, AnalyticsTableType } from '@/src/models/analytics/table';
import { ColumnEditValues } from '@/src/models/analytics/tables-ui';

describe('createColumnRow', () => {
  test('creates a blank row with a unique id and string default type', () => {
    const a = createColumnRow();
    const b = createColumnRow();
    expect(a.id).not.toBe(b.id);
    expect(a).toMatchObject({ source_name: '', name: '', type: AnalyticsFieldType.String, tag: '', nullable: false });
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
      },
      { id: '2', source_name: '', name: 'skip', type: AnalyticsFieldType.String, tag: '', nullable: false },
      { id: '3', source_name: 'x', name: 'x', type: AnalyticsFieldType.Long, tag: '', nullable: false },
    ];
    expect(toTableColumns(rows)).toEqual([
      { source_name: 'event_id', name: 'event', type: AnalyticsFieldType.Uuid, nullable: true, tag: 'identity' },
      { source_name: 'x', name: 'x', type: AnalyticsFieldType.Long, nullable: false },
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
  ...overrides,
});

describe('buildColumnEditPatch', () => {
  test('returns null when nothing changed (including whitespace-only differences)', () => {
    expect(buildColumnEditPatch(COLUMN, values())).toBeNull();
    expect(buildColumnEditPatch(COLUMN, values({ display_name: ' Total money ', tag: ' metric ' }))).toBeNull();
  });

  test('single-field diffs produce a single op', () => {
    expect(buildColumnEditPatch(COLUMN, values({ display_name: 'Total money spend' }))).toEqual({
      set_display_name: [{ name: 'total_money', display_name: 'Total money spend' }],
    });
    expect(buildColumnEditPatch(COLUMN, values({ tag: 'cost' }))).toEqual({
      retag: [{ name: 'total_money', tag: 'cost' }],
    });
    expect(buildColumnEditPatch(COLUMN, values({ description: 'Money spent on the request' }))).toEqual({
      redescribe: [{ name: 'total_money', description: 'Money spent on the request' }],
    });
    expect(buildColumnEditPatch(COLUMN, values({ name: 'total_cost' }))).toEqual({
      rename: [{ from: 'total_money', to: 'total_cost' }],
    });
  });

  test('combined rename + metadata ops reference the post-rename name', () => {
    expect(buildColumnEditPatch(COLUMN, values({ name: 'total_cost', display_name: 'Total money spend' }))).toEqual({
      rename: [{ from: 'total_money', to: 'total_cost' }],
      set_display_name: [{ name: 'total_cost', display_name: 'Total money spend' }],
    });
  });

  test('blank metadata values are sent as the clear signal', () => {
    expect(buildColumnEditPatch(COLUMN, values({ display_name: '', description: '  ' }))).toEqual({
      set_display_name: [{ name: 'total_money', display_name: '' }],
      redescribe: [{ name: 'total_money', description: '' }],
    });
  });

  test('setting metadata on a column without any produces the ops', () => {
    const bare: AnalyticsTableColumn = { source_name: 'x', name: 'x', type: AnalyticsFieldType.String };
    expect(buildColumnEditPatch(bare, { name: 'x', display_name: 'X value', tag: '', description: '' })).toEqual({
      set_display_name: [{ name: 'x', display_name: 'X value' }],
    });
  });

  test('a blank name never produces a rename op', () => {
    expect(buildColumnEditPatch(COLUMN, values({ name: '  ' }))).toBeNull();
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
