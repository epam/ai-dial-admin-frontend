import { GRID_SELECTION_COLUMN_ID } from '@epam/ai-dial-ui-kit';
import { FileManagerColumnKey } from '@epam/ai-dial-react-file-manager';
import { ColumnState, GridApi } from 'ag-grid-community';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { GRID_COLUMNS_KEY } from '@/src/components/Grid/constants';
import {
  applyGridState,
  getColumnsStateFromStorage,
  mergeColumnOrder,
  saveColumnsStateToStorage,
} from '@/src/components/Grid/utils';

const STORAGE_KEY = 'runs-v2';
const DEFAULT_SORTS: ColumnState[] = [{ colId: 'startedAt', sort: 'desc' }];

describe('getColumnsStateFromStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('defaults the filter model to an empty map, the shape setFilterModel reads', () => {
    const model = getColumnsStateFromStorage(STORAGE_KEY, DEFAULT_SORTS);

    expect(model.columns).toEqual(DEFAULT_SORTS);
    expect(Array.isArray(model.filters)).toBe(false);
    expect(model.filters).toEqual({});
  });

  test('returns the stored filter model as it was written', () => {
    const filters = { status: { filterType: 'text', type: 'equals', filter: 'COMPLETED' } };
    saveColumnsStateToStorage(STORAGE_KEY, { columns: DEFAULT_SORTS, filters });

    expect(getColumnsStateFromStorage(STORAGE_KEY, []).filters).toEqual(filters);
  });

  test('falls back to the defaults when the stored entry holds nothing', () => {
    localStorage.setItem(`${GRID_COLUMNS_KEY}${STORAGE_KEY}`, '{}');

    expect(getColumnsStateFromStorage(STORAGE_KEY, DEFAULT_SORTS)).toEqual({
      columns: DEFAULT_SORTS,
      filters: {},
    });
  });

  test.each(['{not json', 'null', '"text"'])('falls back to the defaults when the stored entry is %s', (stored) => {
    localStorage.setItem(`${GRID_COLUMNS_KEY}${STORAGE_KEY}`, stored);

    expect(getColumnsStateFromStorage(STORAGE_KEY, DEFAULT_SORTS)).toEqual({
      columns: DEFAULT_SORTS,
      filters: {},
    });
  });
});

describe('mergeColumnOrder', () => {
  test('keeps the stored slots of columns that are not shown and appends new ones', () => {
    const stored: ColumnState[] = [{ colId: 'a' }, { colId: 'b' }, { colId: 'c' }];
    const current: ColumnState[] = [{ colId: 'c' }, { colId: 'a' }, { colId: 'd' }];

    expect(mergeColumnOrder(current, stored)).toEqual([{ colId: 'c' }, { colId: 'b' }, { colId: 'a' }, { colId: 'd' }]);
  });

  test('keeps the select column first and the actions column last', () => {
    const stored: ColumnState[] = [{ colId: 'name' }, { colId: FileManagerColumnKey.Actions }, { colId: 'author' }];
    const current: ColumnState[] = [
      { colId: 'name' },
      { colId: GRID_SELECTION_COLUMN_ID },
      { colId: FileManagerColumnKey.Actions },
      { colId: 'author' },
    ];

    expect(mergeColumnOrder(current, stored).map((column) => column.colId)).toEqual([
      GRID_SELECTION_COLUMN_ID,
      'name',
      'author',
      FileManagerColumnKey.Actions,
    ]);
  });

  test('returns the current order when nothing is stored', () => {
    const current: ColumnState[] = [{ colId: 'a' }, { colId: 'b' }];

    expect(mergeColumnOrder(current, [])).toEqual(current);
  });
});

describe('applyGridState', () => {
  const makeApi = (columnState: ColumnState[]) =>
    ({
      applyColumnState: vi.fn(),
      setFilterModel: vi.fn(),
      getColumnState: vi.fn(() => columnState),
    }) as unknown as GridApi & { applyColumnState: ReturnType<typeof vi.fn> };

  // What the grid shows after a folder with fewer columns: the re-added utility columns sit next to `name`.
  const MISPLACED: ColumnState[] = [
    { colId: 'name' },
    { colId: GRID_SELECTION_COLUMN_ID },
    { colId: FileManagerColumnKey.Actions },
    { colId: 'author' },
  ];
  const EXPECTED_ORDER = [
    { colId: GRID_SELECTION_COLUMN_ID },
    { colId: 'name' },
    { colId: 'author' },
    { colId: FileManagerColumnKey.Actions },
  ];

  test('moves the select column first and the actions column last when restoring order', () => {
    const api = makeApi(MISPLACED);

    applyGridState(api, { columns: [{ colId: 'name' }, { colId: 'author' }], filters: {} }, [], true);

    expect(api.applyColumnState).toHaveBeenLastCalledWith({ state: EXPECTED_ORDER, applyOrder: true });
  });

  test('moves the utility columns when nothing is stored', () => {
    const api = makeApi(MISPLACED);

    applyGridState(api, null, DEFAULT_SORTS, true);

    expect(api.applyColumnState).toHaveBeenCalledWith({ state: DEFAULT_SORTS });
    expect(api.applyColumnState).toHaveBeenLastCalledWith({ state: EXPECTED_ORDER, applyOrder: true });
  });

  test('does not reorder a grid whose utility columns are already at the edges', () => {
    const api = makeApi(EXPECTED_ORDER);

    applyGridState(api, null, DEFAULT_SORTS, true);

    expect(api.applyColumnState).toHaveBeenCalledTimes(1);
  });

  test('leaves the order alone when the grid does not restore it', () => {
    const api = makeApi(MISPLACED);

    applyGridState(api, null, DEFAULT_SORTS);

    expect(api.applyColumnState).toHaveBeenCalledTimes(1);
    expect(api.getColumnState).not.toHaveBeenCalled();
  });
});
