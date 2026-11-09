import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ColDef, GridApi, GridOptions, GridReadyEvent } from 'ag-grid-community';
import { JSONSchema7 } from 'json-schema';
import { useEffect } from 'react';

import { BasicI18nKey } from '@/src/constants/i18n';
import { CATALOG_SCHEMA_META_COLUMNS } from '../constants';
import { SchemaFieldRow, jsonSchemaToFields } from '../utils';
import SchemaGrid from '../SchemaGrid';

const dispatch = vi.fn();
const gridUpdates = vi.fn<(options: GridOptions<SchemaFieldRow>) => void>();

// The global mock in `test-setup.tsx` hands out a fresh `vi.fn()` per call, so the dispatch a
// component made is unobservable through it — this spec needs its own.
vi.mock('@/src/context/SaveValidationContext', () => ({
  useSaveValidationContext: () => ({ isValid: true, dispatch, resetCounter: 0 }),
  ValidationActionType: { SetField: 'SET_FIELD_VALIDATION', RemoveField: 'REMOVE_FIELD_VALIDATION' },
}));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ onGridReady }: { onGridReady: (event: GridReadyEvent) => void }) => {
    useEffect(() => {
      const api = { updateGridOptions: gridUpdates, isDestroyed: () => false } as unknown as GridApi;
      onGridReady({ api } as GridReadyEvent);
    }, [onGridReady]);
    return <section aria-label="grid" />;
  },
}));

const LONG_TITLE = 'x'.repeat(1001);

const schemaWithTitle = (title: string): JSONSchema7 => ({
  type: 'object',
  properties: { summary: { type: 'string', title } },
});

const lastValidity = () =>
  dispatch.mock.calls
    .map(([action]) => action)
    .filter((action) => action.type === 'SET_FIELD_VALIDATION')
    .at(-1)?.isValid;

describe('SchemaGrid :: widget metadata', () => {
  beforeEach(() => {
    dispatch.mockClear();
    gridUpdates.mockClear();
  });

  test.each([
    ['sibling hints', { 'dial:tab': 'About', 'dial:localized': true }, { 'dial:tab': 'About', 'dial:localized': true }],
    ['no sibling hints', {}, undefined],
  ])('clears a required property widget and preserves %s through save and reopen', (_label, siblings, expectedMeta) => {
    const initial: JSONSchema7 = {
      type: 'object',
      properties: {
        summary: { type: 'string', 'dial:meta': { ...siblings, 'dial:widget': 'badge' } } as JSONSchema7,
      },
      required: ['summary'],
    };
    const onChange = vi.fn();
    const view = render(<SchemaGrid schema={initial} onChange={onChange} metaColumns={CATALOG_SCHEMA_META_COLUMNS} />);
    const options = gridUpdates.mock.calls
      .map(([update]) => update)
      .findLast((update) => update.rowData && update.columnDefs);
    const row = options?.rowData?.find((item) => item.name === 'summary');
    const widget = options?.columnDefs?.find((column) => 'colId' in column && column.colId === 'catalogWidget') as
      | ColDef<SchemaFieldRow>
      | undefined;
    expect(row?.required).toBe(true);
    expect(lastValidity()).toBe(true);

    act(() => widget?.cellRendererParams.onChange('', row));

    const saved = JSON.parse(JSON.stringify(onChange.mock.lastCall?.[0])) as JSONSchema7;
    expect(saved).toEqual({
      type: 'object',
      properties: { summary: { type: 'string', ...(expectedMeta && { 'dial:meta': expectedMeta }) } },
      required: ['summary'],
    });
    expect(jsonSchemaToFields(saved)[0].dialMeta).toEqual(expectedMeta);
    expect(lastValidity()).toBe(true);

    view.unmount();
    gridUpdates.mockClear();
    render(<SchemaGrid schema={saved} onChange={onChange} metaColumns={CATALOG_SCHEMA_META_COLUMNS} />);
    const reopened = gridUpdates.mock.calls
      .map(([update]) => update)
      .findLast((update) => update.rowData && update.columnDefs);
    const reopenedRow = reopened?.rowData?.find((item) => item.name === 'summary');
    const reopenedWidget = reopened?.columnDefs?.find(
      (column) => 'colId' in column && column.colId === 'catalogWidget',
    ) as ColDef<SchemaFieldRow> | undefined;
    expect(reopenedRow?.dialMeta).toEqual(expectedMeta);

    act(() => reopenedWidget?.cellRendererParams.onChange('image', reopenedRow));
    expect(onChange).toHaveBeenLastCalledWith(
      {
        type: 'object',
        properties: { summary: { type: 'string', 'dial:meta': { ...siblings, 'dial:widget': 'image' } } },
        required: ['summary'],
      },
      undefined,
    );
  });
});

describe('SchemaGrid :: field constraints', () => {
  beforeEach(() => {
    dispatch.mockClear();
  });

  test('Should block save and name the field for an over-limit title, without showing the title', () => {
    render(<SchemaGrid schema={schemaWithTitle(LONG_TITLE)} onChange={vi.fn()} />);

    expect(lastValidity()).toBe(false);
    expect(screen.getByText(BasicI18nKey.FieldValueTooLong)).toBeTruthy();
    expect(screen.queryByText(LONG_TITLE, { exact: false })).not.toBeInTheDocument();
  });

  test('Should unblock save and drop the message once the title fits', () => {
    const { rerender } = render(<SchemaGrid schema={schemaWithTitle(LONG_TITLE)} onChange={vi.fn()} />);

    rerender(<SchemaGrid schema={schemaWithTitle('Summary')} onChange={vi.fn()} />);

    expect(lastValidity()).toBe(true);
    expect(screen.queryByText(BasicI18nKey.FieldValueTooLong)).toBeNull();
  });

  test('Should not block save when the consumer switches the defaults off', () => {
    render(<SchemaGrid schema={schemaWithTitle(LONG_TITLE)} onChange={vi.fn()} fieldInputProps={false} />);

    expect(lastValidity()).toBe(true);
    expect(screen.queryByText(BasicI18nKey.FieldValueTooLong)).toBeNull();
  });

  test('Should not block save on a read-only grid', () => {
    render(<SchemaGrid schema={schemaWithTitle(LONG_TITLE)} onChange={vi.fn()} isReadonly />);

    expect(lastValidity()).toBe(true);
    expect(screen.queryByText(BasicI18nKey.FieldValueTooLong)).toBeNull();
  });
});
