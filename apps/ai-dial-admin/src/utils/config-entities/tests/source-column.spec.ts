import { describe, expect, test } from 'vitest';

import { DESCRIPTION_COLUMN, DISPLAY_NAME_COLUMN } from '@/src/constants/grid-columns/base-columns';
import { ConfigEntityOrigin, ConfigFileEntityType } from '@/src/types/config-file-entity';
import { hasConfigEntityOrigin, withSourceColumn } from '@/src/utils/config-entities/source-column';
import { toConfigEntityRows } from '@/src/utils/config-entities/rows';

const BASE = [DISPLAY_NAME_COLUMN, DESCRIPTION_COLUMN];

const coreRows = () =>
  toConfigEntityRows(
    [
      { name: 'from-file', origin: ConfigEntityOrigin.ConfigFile },
      { name: 'from-api', origin: ConfigEntityOrigin.Api },
    ],
    ConfigFileEntityType.Interceptors,
  );

const sourceColumn = (columns: ReturnType<typeof withSourceColumn>) =>
  columns.find((column) => column.colId === 'origin');

describe('withSourceColumn', () => {
  test('appends a Source column when the rows carry an origin', () => {
    const columns = withSourceColumn(BASE, coreRows());

    expect(columns).toHaveLength(BASE.length + 1);
    expect(sourceColumn(columns)?.headerName).toBe('Source');
  });

  // The grids are shared by roughly fifteen admin-backend-backed surfaces. Being data-driven is what
  // keeps the column off those grids without each of them knowing it exists.
  test('leaves admin-backend rows untouched', () => {
    expect(withSourceColumn(BASE, [{ name: 'plain', displayName: 'plain' }])).toEqual(BASE);
  });

  test('leaves an empty or absent row set untouched', () => {
    expect(withSourceColumn(BASE, [])).toEqual(BASE);
    expect(withSourceColumn(BASE, null)).toEqual(BASE);
    expect(withSourceColumn(BASE, undefined)).toEqual(BASE);
  });

  test('renders a human label per origin rather than the enum value', () => {
    const column = sourceColumn(withSourceColumn(BASE, coreRows()));
    const valueGetter = column?.valueGetter as (params: { data: unknown }) => string;

    expect(valueGetter({ data: { origin: ConfigEntityOrigin.ConfigFile } })).toBe('Configuration file');
    expect(valueGetter({ data: { origin: ConfigEntityOrigin.Api } })).toBe('API');
  });

  test('renders an empty label for a row with no origin rather than throwing', () => {
    const column = sourceColumn(withSourceColumn(BASE, coreRows()));
    const valueGetter = column?.valueGetter as (params: { data: unknown }) => string;

    expect(valueGetter({ data: {} })).toBe('');
    expect(valueGetter({ data: undefined })).toBe('');
  });
});

describe('hasConfigEntityOrigin', () => {
  test('is true only when a row actually carries an origin', () => {
    expect(hasConfigEntityOrigin(coreRows())).toBe(true);
    expect(hasConfigEntityOrigin([{ name: 'plain' }])).toBe(false);
    expect(hasConfigEntityOrigin([])).toBe(false);
    expect(hasConfigEntityOrigin(undefined)).toBe(false);
  });

  test('is true when only some rows carry an origin', () => {
    expect(hasConfigEntityOrigin([{ name: 'plain' }, ...coreRows()])).toBe(true);
  });
});
