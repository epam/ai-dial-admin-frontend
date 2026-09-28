import { describe, expect, test, vi } from 'vitest';

import { ColDef, ValueGetterParams } from 'ag-grid-community';

import { APP_RUNNER_META_COLUMNS, CATALOG_SCHEMA_META_COLUMNS } from '../constants';
import { getSchemaGridColumns } from '../columns';
import { SchemaMetaColumn, SchemaMetaHandlers } from '../models';
import { SchemaFieldRow } from '../utils';

const t = (key: string) => key;

const noop = () => undefined;

const row = (overrides: Partial<SchemaFieldRow> = {}): SchemaFieldRow =>
  ({
    id: 'f1',
    name: 'summary',
    type: 'string',
    required: false,
    title: '',
    description: '',
    expanded: false,
    children: [],
    parentId: null,
    depth: 0,
    ...overrides,
  }) as SchemaFieldRow;

/** The grid builds one column per supplied handler, so a caller's meta set is expressed as handlers. */
const columnsFor = (metaColumns: SchemaMetaColumn[], overrides: SchemaMetaHandlers = {}) =>
  getSchemaGridColumns(noop, noop, noop, noop, noop, noop, noop, t, false, {
    ...Object.fromEntries(metaColumns.map((column) => [column, noop])),
    ...overrides,
  }) as ColDef<SchemaFieldRow>[];

const colIds = (columns: ColDef<SchemaFieldRow>[]) => columns.map((column) => column.colId).filter(Boolean);

describe('SchemaGrid :: getSchemaGridColumns', () => {
  test('Should render no meta column when a caller supplies no meta callback', () => {
    const ids = colIds(columnsFor([]));

    expect(ids).not.toContain('order');
    expect(ids).not.toContain('propertyKind');
    expect(ids).not.toContain('catalogTab');
    expect(ids).not.toContain('catalogSection');
    expect(ids).not.toContain('catalogWidget');
    expect(ids).not.toContain('catalogLocalized');
  });

  test('Should render order and property kind for the app-runner set, and no catalog column', () => {
    const ids = colIds(columnsFor(APP_RUNNER_META_COLUMNS));

    expect(ids).toContain('order');
    expect(ids).toContain('propertyKind');
    expect(ids).not.toContain('catalogTab');
    expect(ids).not.toContain('catalogWidget');
  });

  test('Should render the catalog presentation hints and omit property kind for the catalog set', () => {
    const ids = colIds(columnsFor(CATALOG_SCHEMA_META_COLUMNS));

    expect(ids).toContain('catalogTab');
    expect(ids).toContain('catalogSection');
    expect(ids).toContain('order');
    expect(ids).toContain('catalogWidget');
    expect(ids).toContain('catalogLocalized');
    expect(ids).not.toContain('propertyKind');
  });

  test('Should offer exactly the widget values Core allows', () => {
    const widget = columnsFor(CATALOG_SCHEMA_META_COLUMNS).find((column) => column.colId === 'catalogWidget');

    expect((widget?.cellRendererParams as { items: { value: string }[] }).items.map((item) => item.value)).toEqual([
      'text',
      'richText',
      'badge',
      'chips',
      'url',
      'boolean',
      'image',
      'date',
    ]);
  });

  test.each([
    ['catalogTab', 'dial:tab', 'About'],
    ['catalogSection', 'dial:section', 'Capabilities'],
    ['catalogWidget', 'dial:widget', 'badge'],
  ])('Should read %s from its own dial:meta key', (colId, metaKey, value) => {
    const column = columnsFor(CATALOG_SCHEMA_META_COLUMNS).find((c) => c.colId === colId);
    const data = row({ dialMeta: { [metaKey]: value } });

    const read = column?.valueGetter as (params: ValueGetterParams<SchemaFieldRow>) => unknown;

    expect(read({ data } as ValueGetterParams<SchemaFieldRow>)).toEqual(value);
  });

  test('Should read localized as a boolean, defaulting to false when the key is absent', () => {
    const column = columnsFor(CATALOG_SCHEMA_META_COLUMNS).find((c) => c.colId === 'catalogLocalized');
    const read = column?.valueGetter as (params: ValueGetterParams<SchemaFieldRow>) => unknown;

    expect(read({ data: row({ dialMeta: { 'dial:localized': true } }) } as ValueGetterParams<SchemaFieldRow>)).toBe(
      true,
    );
    expect(read({ data: row() } as ValueGetterParams<SchemaFieldRow>)).toBe(false);
  });

  test('Should leave every catalog column empty on a nested row', () => {
    const nested = row({ parentId: 'parent', depth: 1, dialMeta: { 'dial:tab': 'About' } });

    const reads = columnsFor(CATALOG_SCHEMA_META_COLUMNS)
      .filter((column) => column.colId?.startsWith('catalog'))
      .map((column) => column.valueGetter as (params: ValueGetterParams<SchemaFieldRow>) => unknown);

    reads.forEach((read) => {
      expect(read({ data: nested } as ValueGetterParams<SchemaFieldRow>)).toBeUndefined();
    });
  });

  test('Should pass each catalog edit to the handler the caller supplied', () => {
    const onChangeTab = vi.fn();
    const columns = columnsFor([SchemaMetaColumn.Tab], { [SchemaMetaColumn.Tab]: onChangeTab });
    const column = columns.find((c) => c.colId === 'catalogTab');
    const data = row();

    (column?.cellRendererParams as { onChange: (value: string, data: SchemaFieldRow) => void }).onChange('About', data);

    expect(onChangeTab).toHaveBeenCalledWith('About', data);
  });
});
