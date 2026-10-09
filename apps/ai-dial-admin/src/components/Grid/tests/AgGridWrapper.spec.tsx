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

import { saveColumnsStateToStorage } from '@/src/components/Grid/utils';
import AgGridWrapper from '../AgGridWrapper';
import DisplayNameCellRenderer from '../CellRenderers/DisplayNameCellRenderer';
import RadioNameCellRenderer from '../CellRenderers/RadioNameCellRenderer';

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

  test('forwards the grid-ready callback with the api once the kit grid exposes it', () => {
    const onGridReady = vi.fn();
    const api = makeFakeApi();

    render(<AgGridWrapper columnDefs={[{ field: 'id' }]} rowData={[]} onGridReady={onGridReady} />);
    fireGridApiChange(api);

    expect(onGridReady).toHaveBeenCalledWith(expect.objectContaining({ api }));
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

  test('writes column state for a resize the operator performed', () => {
    renderWithStorage();
    vi.mocked(saveColumnsStateToStorage).mockClear();

    fireColumnResized('uiColumnResized');

    expect(saveColumnsStateToStorage).toHaveBeenCalledWith(STORAGE_KEY, expect.anything());
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

  test('disables fit-to-width sizing for a grid with persisted state', () => {
    render(<AgGridWrapper columnDefs={[{ field: 'id' }]} rowData={[]} storageKey="runs-v2" />);

    expect(gridOptions().autoSizeStrategy).toBeUndefined();
    expect(gridOptions().onGridSizeChanged).toBeUndefined();
    expect('autoSizeStrategy' in gridOptions()).toBe(true);
  });
});
