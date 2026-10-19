import { GridColorScheme } from '@epam/ai-dial-ui-kit';
import { act, render } from '@testing-library/react';
import type { ColDef } from 'ag-grid-community';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { mockState } = vi.hoisted(() => ({
  mockState: { lastProps: null as Record<string, unknown> | null },
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@epam/ai-dial-ui-kit')>()),
  Grid: (props: Record<string, unknown>) => {
    mockState.lastProps = props;
    return null;
  },
}));

vi.mock('@/src/components/Grid/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/components/Grid/utils')>()),
  saveColumnsStateToStorage: vi.fn(),
}));

import { useTheme } from '@/src/context/ThemeContext';
import { GRID_COLUMNS_KEY } from '@/src/components/Grid/constants';
import { type GridModel, saveColumnsStateToStorage } from '@/src/components/Grid/utils';
import AgGridWrapper from '../AgGridWrapper';
import DisplayNameCellRenderer from '../CellRenderers/DisplayNameCellRenderer';
import RadioNameCellRenderer from '../CellRenderers/RadioNameCellRenderer';
import FloatingFilter from '../FloatingFilter/FloatingFilter';

const makeFakeApi = () => ({
  applyColumnState: vi.fn(),
  setFilterModel: vi.fn(),
  getColumnState: vi.fn(() => []),
  getFilterModel: vi.fn(() => ({})),
  getGridOption: vi.fn(),
});

const gridOptions = () => mockState.lastProps?.additionalGridOptions as Record<string, unknown>;

const fireGridApiChange = (api: ReturnType<typeof makeFakeApi>) => {
  act(() => {
    const onGridApiChange = mockState.lastProps?.onGridApiChange as ((api: unknown) => void) | undefined;
    onGridApiChange?.(api);
  });
};

describe('AgGridWrapper', () => {
  beforeEach(() => {
    mockState.lastProps = null;
  });

  test('passes rowData and columnDefs to the kit grid as props', () => {
    const rowData = [{ id: '1' }];
    const columnDefs = [{ field: 'id' }];

    render(<AgGridWrapper columnDefs={columnDefs} rowData={rowData} />);

    expect(mockState.lastProps?.rowData).toEqual(rowData);
    expect(mockState.lastProps?.columnDefs).toEqual(columnDefs);
  });

  test('passes the dark grid color scheme when the app theme is dark', () => {
    render(<AgGridWrapper columnDefs={[{ field: 'id' }]} rowData={[]} />);

    expect(mockState.lastProps?.colorScheme).toBe(GridColorScheme.Dark);
  });

  test('passes the light grid color scheme when the app theme is light', () => {
    vi.mocked(useTheme).mockReturnValueOnce({ currentTheme: 'light' } as ReturnType<typeof useTheme>);

    render(<AgGridWrapper columnDefs={[{ field: 'id' }]} rowData={[]} />);

    expect(mockState.lastProps?.colorScheme).toBe(GridColorScheme.Light);
  });

  test('forwards the grid-ready callback with the api once the kit grid exposes it', () => {
    const onGridReady = vi.fn();
    const api = makeFakeApi();

    render(<AgGridWrapper columnDefs={[{ field: 'id' }]} rowData={[]} onGridReady={onGridReady} />);
    fireGridApiChange(api);

    expect(onGridReady).toHaveBeenCalledWith(expect.objectContaining({ api }));
  });

  test('uses the custom floating filter by default and retains caller column defaults', () => {
    render(
      <AgGridWrapper
        columnDefs={[{ field: 'id', floatingFilter: true }]}
        rowData={[]}
        additionalGridOptions={{ defaultColDef: { resizable: true } }}
      />,
    );

    expect(gridOptions().defaultColDef).toMatchObject({
      floatingFilterComponent: FloatingFilter,
      resizable: true,
    });
  });

  test('lets caller grid options override the wrapper defaults', () => {
    render(
      <AgGridWrapper
        columnDefs={[{ field: 'id' }]}
        rowData={[]}
        additionalGridOptions={{ preventDefaultOnContextMenu: false }}
      />,
    );

    expect(gridOptions().preventDefaultOnContextMenu).toBe(false);
  });

  describe('row and header height', () => {
    test('uses the 40px default header', () => {
      render(<AgGridWrapper columnDefs={[{ field: 'id' }]} rowData={[]} />);

      expect(gridOptions().headerHeight).toBe(40);
    });

    test('leaves the kit row height for a list without an icon next to the name', () => {
      render(<AgGridWrapper columnDefs={[{ field: 'id' }]} rowData={[]} />);

      expect('rowHeight' in gridOptions()).toBe(false);
    });

    test('uses 56px rows when the name cell carries an icon', () => {
      render(<AgGridWrapper columnDefs={[{ field: 'name', cellRenderer: DisplayNameCellRenderer }]} rowData={[]} />);

      expect(gridOptions().rowHeight).toBe(56);
    });

    test('finds the icon name column inside a column group', () => {
      render(
        <AgGridWrapper
          columnDefs={[
            { headerName: 'Group', children: [{ field: 'name', cellRenderer: RadioNameCellRenderer }] } as ColDef,
          ]}
          rowData={[]}
        />,
      );

      expect(gridOptions().rowHeight).toBe(56);
    });

    test('keeps a custom row height supplied by the caller', () => {
      const getRowHeight = vi.fn(() => 64);
      const { rerender } = render(
        <AgGridWrapper
          columnDefs={[{ field: 'name', cellRenderer: DisplayNameCellRenderer }]}
          rowData={[]}
          additionalGridOptions={{ rowHeight: 80 }}
        />,
      );

      expect(gridOptions().rowHeight).toBe(80);

      rerender(
        <AgGridWrapper
          columnDefs={[{ field: 'name', cellRenderer: DisplayNameCellRenderer }]}
          rowData={[]}
          additionalGridOptions={{ getRowHeight }}
        />,
      );

      expect(gridOptions().getRowHeight).toBe(getRowHeight);
    });
  });

  test('provides a copy item in the row context menu, plus open-in-new-tab when a href exists', () => {
    const { rerender } = render(<AgGridWrapper columnDefs={[{ field: 'id' }]} rowData={[]} />);
    const getItems = mockState.lastProps?.getContextMenuItems as (row: object) => { key: string }[];

    expect(getItems({ id: '1' }).map((item) => item.key)).toEqual(['copy']);

    rerender(<AgGridWrapper columnDefs={[{ field: 'id' }]} rowData={[]} getHref={() => '/entity/1'} />);
    const getItemsWithHref = mockState.lastProps?.getContextMenuItems as (row: object) => { key: string }[];

    expect(getItemsWithHref({ id: '1' }).map((item) => item.key)).toEqual(['copy', 'open-in-new-tab']);
  });

  describe('state restore', () => {
    test('applies default sorts once the api is available', () => {
      const api = makeFakeApi();

      render(<AgGridWrapper columnDefs={[{ field: 'id', sort: 'asc' }]} rowData={[{ id: '1' }]} />);
      fireGridApiChange(api);

      expect(api.applyColumnState).toHaveBeenCalledWith({ state: [{ colId: 'id', sort: 'asc' }] });
    });

    test('does not re-apply state when only rowData changes', () => {
      const api = makeFakeApi();
      const columnDefs = [{ field: 'id' }];
      const { rerender } = render(<AgGridWrapper columnDefs={columnDefs} rowData={[{ id: '1' }]} />);
      fireGridApiChange(api);
      api.applyColumnState.mockClear();

      rerender(<AgGridWrapper columnDefs={columnDefs} rowData={[{ id: '1' }, { id: '2' }]} />);

      expect(api.applyColumnState).not.toHaveBeenCalled();
    });

    test('re-applies state when columnDefs change', () => {
      const api = makeFakeApi();
      const { rerender } = render(<AgGridWrapper columnDefs={[{ field: 'id' }]} rowData={[{ id: '1' }]} />);
      fireGridApiChange(api);
      api.applyColumnState.mockClear();

      rerender(<AgGridWrapper columnDefs={[{ field: 'id' }, { field: 'message' }]} rowData={[{ id: '1' }]} />);

      expect(api.applyColumnState).toHaveBeenCalled();
    });
  });

  describe('live data', () => {
    test('turns row animation off', () => {
      render(<AgGridWrapper columnDefs={[{ field: 'id' }]} rowData={[{ id: '1' }]} isLiveData />);

      expect(gridOptions().animateRows).toBe(false);
    });

    test('adapts getRowId to the kit signature when provided, omits it otherwise', () => {
      const getRowId = ({ data }: { data: { id: string } }) => data.id;
      const { rerender } = render(
        <AgGridWrapper columnDefs={[{ field: 'id' }]} rowData={[{ id: '1' }]} isLiveData getRowId={getRowId} />,
      );
      const kitGetRowId = mockState.lastProps?.getRowId as (row: { id: string }) => string;

      expect(kitGetRowId({ id: 'row-1' })).toBe('row-1');

      rerender(<AgGridWrapper columnDefs={[{ field: 'id' }]} rowData={[{ id: '1' }]} isLiveData />);

      expect(mockState.lastProps?.getRowId).toBeUndefined();
    });
  });
});

describe('AgGridWrapper — column state persistence', () => {
  const STORAGE_KEY = 'runs-v2';
  const DEBOUNCE_MS = 300;

  const renderWithStorage = () => {
    const result = render(
      <AgGridWrapper columnDefs={[{ field: 'id' }]} rowData={[{ id: '1' }]} storageKey={STORAGE_KEY} />,
    );
    fireGridApiChange(makeFakeApi());
    return result;
  };

  const fireColumnResized = (source: string) => {
    act(() => {
      const onColumnResized = gridOptions().onColumnResized as ((event: unknown) => void) | undefined;
      onColumnResized?.({ source, api: makeFakeApi() });
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });
  };

  beforeEach(() => {
    vi.useFakeTimers();
    mockState.lastProps = null;
    vi.mocked(saveColumnsStateToStorage).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('does not write column state for a resize the grid itself performed', () => {
    renderWithStorage();
    vi.mocked(saveColumnsStateToStorage).mockClear();

    fireColumnResized('autosizeColumns');

    expect(saveColumnsStateToStorage).not.toHaveBeenCalled();
  });

  test('keeps the width of a column the operator resized and drops widths they did not drag', () => {
    renderWithStorage();
    vi.mocked(saveColumnsStateToStorage).mockClear();
    const colDef = {};

    act(() => {
      const onColumnResized = gridOptions().onColumnResized as (event: unknown) => void;
      onColumnResized({
        source: 'uiColumnResized',
        columns: [{ getColId: () => 'id', getColDef: () => colDef }],
        api: { ...makeFakeApi(), getColumnState: () => [{ colId: 'id', width: 240 }] },
      });
      vi.advanceTimersByTime(DEBOUNCE_MS);
    });

    expect(saveColumnsStateToStorage).toHaveBeenCalledWith(STORAGE_KEY, {
      columns: [{ colId: 'id', width: 240 }],
      filters: {},
      sizedColIds: ['id'],
    });

    vi.mocked(saveColumnsStateToStorage).mockClear();
    act(() => {
      const onSortChanged = gridOptions().onSortChanged as (event: unknown) => void;
      onSortChanged({
        api: {
          ...makeFakeApi(),
          getColumnState: () => [
            { colId: 'id', width: 240 },
            { colId: 'name', width: 180, sort: 'asc' },
          ],
        },
      });
    });

    expect(saveColumnsStateToStorage).toHaveBeenCalledWith(STORAGE_KEY, {
      columns: [
        { colId: 'id', width: 240 },
        { colId: 'name', sort: 'asc' },
      ],
      filters: {},
      sizedColIds: ['id'],
    });
  });
});

describe('AgGridWrapper — default and stored width of a sized column', () => {
  const STORAGE_KEY = 'name-width';
  const NAME_COL = { field: 'name', colId: 'name', width: 400, minWidth: 260 };

  const storeModel = (model: GridModel) => {
    localStorage.setItem(`${GRID_COLUMNS_KEY}${STORAGE_KEY}`, JSON.stringify(model));
  };

  const renderedNameColumn = () =>
    (mockState.lastProps?.columnDefs as ColDef[]).find((col) => col.colId === 'name') as ColDef;

  beforeEach(() => {
    mockState.lastProps = null;
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('keeps the default width when the operator never resized the column', () => {
    storeModel({ columns: [{ colId: 'name', width: 180 }], filters: {}, sizedColIds: [] });

    render(<AgGridWrapper columnDefs={[NAME_COL]} rowData={[]} storageKey={STORAGE_KEY} />);

    expect(renderedNameColumn()).toMatchObject({ width: 400, minWidth: 260 });
    expect(renderedNameColumn().suppressSizeToFit).toBeUndefined();
  });

  test('restores the width the operator dragged over the default', () => {
    storeModel({ columns: [{ colId: 'name', width: 520 }], filters: {}, sizedColIds: ['name'] });

    render(<AgGridWrapper columnDefs={[NAME_COL]} rowData={[]} storageKey={STORAGE_KEY} />);

    expect(renderedNameColumn()).toMatchObject({ width: 520, suppressSizeToFit: true });
  });
});

describe('AgGridWrapper — sizing strategy', () => {
  beforeEach(() => {
    mockState.lastProps = null;
  });

  test('leaves the kit fit-to-width sizing in place for a grid without persisted state', () => {
    render(<AgGridWrapper columnDefs={[{ field: 'id' }]} rowData={[]} />);

    expect('autoSizeStrategy' in gridOptions()).toBe(false);
    expect('onGridSizeChanged' in gridOptions()).toBe(false);
  });

  test('refits a persisted grid when its size changes and skips the kit autosize strategy', () => {
    render(<AgGridWrapper columnDefs={[{ field: 'id' }]} rowData={[]} storageKey="runs-v2" />);
    const sizeColumnsToFit = vi.fn();

    act(() => {
      const onGridSizeChanged = gridOptions().onGridSizeChanged as (event: {
        api: { sizeColumnsToFit: () => void };
      }) => void;
      onGridSizeChanged({ api: { sizeColumnsToFit } });
    });

    expect(gridOptions().autoSizeStrategy).toBeUndefined();
    expect('autoSizeStrategy' in gridOptions()).toBe(true);
    expect(sizeColumnsToFit).toHaveBeenCalledOnce();
    expect(sizeColumnsToFit).toHaveBeenCalledWith();
  });

  test('keeps a caller size-change handler on a persisted grid', () => {
    const onGridSizeChanged = vi.fn();

    render(
      <AgGridWrapper
        columnDefs={[{ field: 'id' }]}
        rowData={[]}
        storageKey="runs-v2"
        additionalGridOptions={{ onGridSizeChanged }}
      />,
    );

    expect(gridOptions().onGridSizeChanged).toBe(onGridSizeChanged);
  });
});
