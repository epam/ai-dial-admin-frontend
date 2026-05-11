import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { mockState } = vi.hoisted(() => ({
  mockState: { lastProps: null as Record<string, unknown> | null },
}));

vi.mock('ag-grid-react', () => ({
  AgGridReact: (props: Record<string, unknown>) => {
    mockState.lastProps = props;
    return null;
  },
}));

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
