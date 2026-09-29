import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

const { mockState } = vi.hoisted(() => ({
  mockState: { lastProps: null as Record<string, unknown> | null },
}));

vi.mock('ag-grid-react', () => ({
  AgGridReact: (props: Record<string, unknown>) => {
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

const makeFakeApi = () => ({
  applyColumnState: vi.fn(),
  setFilterModel: vi.fn(),
  updateGridOptions: vi.fn(),
  getColumnState: vi.fn(() => []),
  getFilterModel: vi.fn(() => ({})),
});

const fireOnGridReady = (api: ReturnType<typeof makeFakeApi>) => {
  act(() => {
    const onGridReady = mockState.lastProps?.onGridReady as ((event: { api: unknown }) => void) | undefined;
    onGridReady?.({ api });
  });
};

describe('AgGridWrapper', () => {
  beforeEach(() => {
    mockState.lastProps = null;
  });

  describe('legacy path (isLiveData unset)', () => {
    test('rowData / columnDefs / getRowId are NOT passed to AgGridReact as React props', () => {
      render(
        <AgGridWrapper
          columnDefs={[{ field: 'id' }]}
          rowData={[{ id: '1' }]}
          getRowId={({ data }) => (data as { id: string }).id}
        />,
      );
      expect(mockState.lastProps?.rowData).toBeUndefined();
      expect(mockState.lastProps?.columnDefs).toBeUndefined();
      expect(mockState.lastProps?.getRowId).toBeUndefined();
    });

    test('imperative state restore runs on every rowData change', () => {
      const api = makeFakeApi();
      const rowData = [{ id: '1' }];
      const columnDefs = [{ field: 'id' }];

      const { rerender } = render(<AgGridWrapper columnDefs={columnDefs} rowData={rowData} />);
      fireOnGridReady(api);

      // After onGridReady → re-render → effect runs once.
      expect(api.updateGridOptions).toHaveBeenCalled();
      expect(api.applyColumnState).toHaveBeenCalled();

      api.updateGridOptions.mockClear();
      api.applyColumnState.mockClear();
      api.setFilterModel.mockClear();

      rerender(<AgGridWrapper columnDefs={columnDefs} rowData={[...rowData, { id: '2' }]} />);

      expect(api.updateGridOptions).toHaveBeenCalled();
      expect(api.applyColumnState).toHaveBeenCalled();
    });
  });

  describe('live path (isLiveData={true})', () => {
    test('rowData and columnDefs are passed to AgGridReact as React props', () => {
      const rowData = [{ id: '1' }];
      const columnDefs = [{ field: 'id' }];

      render(<AgGridWrapper columnDefs={columnDefs} rowData={rowData} isLiveData />);

      expect(mockState.lastProps?.rowData).toEqual(rowData);
      expect(mockState.lastProps?.columnDefs).toEqual(columnDefs);
    });

    test('getRowId is forwarded when provided, omitted otherwise', () => {
      const getRowId = ({ data }: { data: { id: string } }) => data.id;

      const { rerender } = render(
        <AgGridWrapper columnDefs={[{ field: 'id' }]} rowData={[{ id: '1' }]} isLiveData getRowId={getRowId} />,
      );
      expect(mockState.lastProps?.getRowId).toBe(getRowId);

      rerender(<AgGridWrapper columnDefs={[{ field: 'id' }]} rowData={[{ id: '1' }]} isLiveData />);
      expect(mockState.lastProps?.getRowId).toBeUndefined();
    });

    test('rowData change does NOT re-apply persisted state', () => {
      const api = makeFakeApi();
      const rowData = [{ id: '1' }];
      const columnDefs = [{ field: 'id' }];

      const { rerender } = render(<AgGridWrapper columnDefs={columnDefs} rowData={rowData} isLiveData />);
      fireOnGridReady(api);

      // Initial mount: live-data effect applies default sorts once.
      expect(api.applyColumnState).toHaveBeenCalledTimes(1);
      expect(api.updateGridOptions).not.toHaveBeenCalled();

      api.applyColumnState.mockClear();
      api.setFilterModel.mockClear();
      api.updateGridOptions.mockClear();

      rerender(<AgGridWrapper columnDefs={columnDefs} rowData={[...rowData, { id: '2' }]} isLiveData />);

      expect(api.applyColumnState).not.toHaveBeenCalled();
      expect(api.setFilterModel).not.toHaveBeenCalled();
      expect(api.updateGridOptions).not.toHaveBeenCalled();
    });

    test('columnDefs change re-applies persisted state', () => {
      const api = makeFakeApi();
      const columnDefs = [{ field: 'id' }];

      const { rerender } = render(<AgGridWrapper columnDefs={columnDefs} rowData={[{ id: '1' }]} isLiveData />);
      fireOnGridReady(api);
      api.applyColumnState.mockClear();

      rerender(
        <AgGridWrapper columnDefs={[{ field: 'id' }, { field: 'message' }]} rowData={[{ id: '1' }]} isLiveData />,
      );

      expect(api.applyColumnState).toHaveBeenCalled();
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
    fireOnGridReady(makeFakeApi());
    return result;
  };

  const fireColumnResized = (source: string) => {
    act(() => {
      const onColumnResized = mockState.lastProps?.onColumnResized as ((event: unknown) => void) | undefined;
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

  test('fits the grid width for a grid without persisted state', () => {
    render(<AgGridWrapper columnDefs={[{ field: 'id' }]} rowData={[]} />);

    expect(mockState.lastProps?.autoSizeStrategy).toEqual({ type: 'fitGridWidth' });
  });

  test('applies no sizing strategy for a grid with persisted state', () => {
    render(<AgGridWrapper columnDefs={[{ field: 'id' }]} rowData={[]} storageKey="runs-v2" />);

    expect(mockState.lastProps?.autoSizeStrategy).toBeUndefined();
  });
});
