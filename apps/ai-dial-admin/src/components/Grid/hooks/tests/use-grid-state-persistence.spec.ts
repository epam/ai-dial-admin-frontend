import { act, renderHook } from '@testing-library/react';
import type { ColDef, ColumnResizedEvent, ColumnState, GridApi } from 'ag-grid-community';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { GRID_COLUMNS_KEY, GRID_STATE_SAVE_DEBOUNCE_MS } from '@/src/components/Grid/constants';
import { useGridStatePersistence } from '@/src/components/Grid/hooks/use-grid-state-persistence';
import { GridStatePersistenceProps } from '@/src/components/Grid/models';
import { GridModel } from '@/src/components/Grid/utils';

const STORAGE_KEY = '/prompts';
const COLUMN_DEFS: ColDef[] = [{ field: 'name' }, { field: 'author' }, { field: 'updatedAt' }];
const FILE_MANAGER_OPTIONS: Partial<GridStatePersistenceProps> = {
  persistedFields: ['width', 'sort', 'sortIndex', 'sortType'],
  userResizeSources: ['uiColumnResized'],
  shouldRestoreOrder: true,
};

const makeApi = (columnState: ColumnState[] = [], filters = {}) =>
  ({
    applyColumnState: vi.fn(),
    setFilterModel: vi.fn(),
    getColumnState: vi.fn(() => columnState),
    getFilterModel: vi.fn(() => filters),
    sizeColumnsToFit: vi.fn(),
  }) as unknown as GridApi & { applyColumnState: ReturnType<typeof vi.fn> };

const storeModel = (model: GridModel) =>
  localStorage.setItem(`${GRID_COLUMNS_KEY}${STORAGE_KEY}`, JSON.stringify(model));

const readModel = (): GridModel | null => {
  const stored = localStorage.getItem(`${GRID_COLUMNS_KEY}${STORAGE_KEY}`);
  return stored ? JSON.parse(stored) : null;
};

const resizeEvent = (api: GridApi, overrides: Partial<ColumnResizedEvent>) =>
  ({
    api,
    finished: true,
    source: 'uiColumnResized',
    columns: [{ getColId: () => 'name', getColDef: () => ({}) }],
    ...overrides,
  }) as unknown as ColumnResizedEvent;

const renderPersistence = (props: Partial<GridStatePersistenceProps> = {}) =>
  renderHook(() =>
    useGridStatePersistence({
      storageKey: STORAGE_KEY,
      columnDefs: COLUMN_DEFS,
      gridApi: makeApi(),
      ...props,
    }),
  );

describe('useGridStatePersistence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  test('stores only the listed fields and the width of the column the operator dragged', () => {
    const { result } = renderPersistence(FILE_MANAGER_OPTIONS);
    const api = makeApi(
      [
        { colId: 'name', width: 420, flex: null, hide: false, pinned: null },
        { colId: 'author', width: 180, flex: 1, sort: 'asc', sortIndex: 0 },
      ],
      { name: { filter: 'readme' } },
    );

    act(() => {
      result.current.onColumnResized(resizeEvent(api, {}));
      vi.advanceTimersByTime(GRID_STATE_SAVE_DEBOUNCE_MS);
    });

    expect(readModel()).toEqual({
      columns: [
        { colId: 'name', width: 420 },
        { colId: 'author', sort: 'asc', sortIndex: 0 },
      ],
      filters: { name: { filter: 'readme' } },
      sizedColIds: ['name'],
    });
  });

  test('gives the merged definitions the width of a drag once it is stored, so a column rebuild keeps it', () => {
    const { result } = renderPersistence(FILE_MANAGER_OPTIONS);
    const api = makeApi([{ colId: 'name', width: 420 }]);

    expect((result.current.columnDefs as ColDef[])[0].width).toBeUndefined();

    act(() => {
      result.current.onColumnResized(resizeEvent(api, {}));
      vi.advanceTimersByTime(GRID_STATE_SAVE_DEBOUNCE_MS);
    });

    expect((result.current.columnDefs as ColDef[])[0]).toMatchObject({ field: 'name', width: 420, flex: null });
  });

  test('ignores a layout resize and an unfinished drag when user resize sources are listed', () => {
    const { result } = renderPersistence(FILE_MANAGER_OPTIONS);
    const api = makeApi([{ colId: 'name', width: 420 }]);

    act(() => {
      result.current.onColumnResized(resizeEvent(api, { source: 'flex' }));
      result.current.onColumnResized(resizeEvent(api, { finished: false }));
      vi.advanceTimersByTime(GRID_STATE_SAVE_DEBOUNCE_MS);
    });

    expect(readModel()).toBeNull();
  });

  test('ignores resizes the grid performed when no user resize sources are listed', () => {
    const { result } = renderPersistence();
    const api = makeApi([{ colId: 'name', width: 420 }]);

    act(() => {
      result.current.onColumnResized(resizeEvent(api, { source: 'sizeColumnsToFit' }));
      result.current.onColumnResized(resizeEvent(api, { source: 'autosizeColumns' }));
      vi.advanceTimersByTime(GRID_STATE_SAVE_DEBOUNCE_MS);
    });

    expect(readModel()).toBeNull();
  });

  test('does not save before the stored state has been applied to a grid', () => {
    storeModel({ columns: [], filters: { name: { filter: 'readme' } }, sizedColIds: [] });
    const { result } = renderPersistence({ gridApi: undefined });

    act(() => {
      result.current.onFilterChanged({ api: makeApi() } as never);
    });

    expect(readModel()?.filters).toEqual({ name: { filter: 'readme' } });
  });

  test('keeps the stored slot of a column the grid is not showing when the hook owns order', () => {
    storeModel({
      columns: [{ colId: 'author' }, { colId: 'name' }, { colId: 'updatedAt' }],
      filters: {},
      sizedColIds: [],
    });
    const { result } = renderPersistence(FILE_MANAGER_OPTIONS);

    act(() => {
      result.current.onSortChanged({
        api: makeApi([{ colId: 'name', sort: 'desc' }, { colId: 'actions' }]),
      } as never);
    });

    expect(readModel()?.columns).toEqual([
      { colId: 'author' },
      { colId: 'name', sort: 'desc' },
      { colId: 'updatedAt' },
      { colId: 'actions' },
    ]);
  });

  test('merges a dragged width as a fixed width, without the column-state-only sort type', () => {
    storeModel({
      columns: [{ colId: 'name', width: 420, sort: 'asc', sortType: 'default' } as ColumnState],
      filters: {},
      sizedColIds: ['name'],
    });

    const { result } = renderPersistence({ columnDefs: [{ field: 'name' }] });

    const [nameColumn] = result.current.columnDefs as ColDef[];
    expect(nameColumn).toMatchObject({ field: 'name', width: 420, flex: null, suppressSizeToFit: true });
    expect(nameColumn).not.toHaveProperty('sortType');
    expect(nameColumn.sort).toBeUndefined();
  });

  test('merges a dragged width into the definition a column factory resolves to', () => {
    storeModel({ columns: [{ colId: 'name', width: 420 }], filters: {}, sizedColIds: ['name'] });
    const factory = vi.fn((_locale: string, _options: undefined, isCompactView: boolean) => ({
      colId: 'name',
      flex: 1,
      wrapText: isCompactView,
    }));

    const { result } = renderPersistence({ columnDefs: [factory as unknown as ColDef] });

    const [wrapped] = result.current.columnDefs as unknown as (typeof factory)[];
    expect(wrapped('en', undefined, true)).toMatchObject({
      colId: 'name',
      wrapText: true,
      width: 420,
      flex: null,
      suppressSizeToFit: true,
    });
    expect(factory).toHaveBeenCalledWith('en', undefined, true);
  });

  test('re-applies order, sort, filters and dragged widths when asked', () => {
    storeModel({
      columns: [
        { colId: 'author', sort: 'asc' },
        { colId: 'name', width: 420 },
        { colId: 'updatedAt', width: 90 },
      ],
      filters: { name: { filter: 'readme' } },
      sizedColIds: ['name'],
    });
    const { result } = renderPersistence(FILE_MANAGER_OPTIONS);
    const api = makeApi();

    act(() => {
      result.current.reapplyState(api);
    });

    expect(api.setFilterModel).toHaveBeenCalledWith({ name: { filter: 'readme' } });
    expect(api.applyColumnState).toHaveBeenCalledWith({
      state: [{ colId: 'author', sort: 'asc' }, { colId: 'name', width: 420, flex: null }, { colId: 'updatedAt' }],
      applyOrder: true,
    });
  });
});
