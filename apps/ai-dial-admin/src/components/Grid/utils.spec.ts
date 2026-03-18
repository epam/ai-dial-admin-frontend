import { ApplicationRoute } from '@/src/types/routes';
import { getFromLocalStorage, setToLocalStorage } from '@/src/utils/local-storage';
import { updateColumnVisibilityInStorage, getColumnVisibilityFromGridState } from './utils';
import { GRID_COLUMNS_KEY } from './constants';
import { describe, expect, test, vi, beforeEach } from 'vitest';

vi.mock('@/src/utils/local-storage', () => ({
  setToLocalStorage: vi.fn(),
  getFromLocalStorage: vi.fn(() => null),
}));

describe('Grid :: updateColumnVisibilityInStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should update hide values in existing stored model', () => {
    const storedModel = {
      columns: [
        { colId: 'name', hide: false, width: 200 },
        { colId: 'status', hide: false, width: 150 },
      ],
      filters: {},
    };
    vi.mocked(getFromLocalStorage).mockReturnValue(JSON.stringify(storedModel));

    const colDefs = [
      { field: 'name', hide: false },
      { field: 'status', hide: true },
    ];
    updateColumnVisibilityInStorage(ApplicationRoute.Models, colDefs);

    expect(setToLocalStorage).toHaveBeenCalledWith(
      `${GRID_COLUMNS_KEY}${ApplicationRoute.Models}`,
      expect.any(String),
    );
    const saved = JSON.parse(vi.mocked(setToLocalStorage).mock.calls[0][1] as string);
    expect(saved.columns[0].hide).toBe(false);
    expect(saved.columns[1].hide).toBe(true);
    expect(saved.columns[1].width).toBe(150);
  });

  test('should handle empty storage gracefully', () => {
    vi.mocked(getFromLocalStorage).mockReturnValue(null);

    const colDefs = [{ field: 'name', hide: true }];
    updateColumnVisibilityInStorage(ApplicationRoute.Models, colDefs);

    expect(setToLocalStorage).toHaveBeenCalled();
  });
});

describe('Grid :: getColumnVisibilityFromGridState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should return null when no stored state exists', () => {
    vi.mocked(getFromLocalStorage).mockReturnValue(null);

    const colDefs = [{ field: 'name', hide: false }];
    expect(getColumnVisibilityFromGridState(ApplicationRoute.Models, colDefs)).toBeNull();
  });

  test('should return null when stored columns are empty', () => {
    vi.mocked(getFromLocalStorage).mockReturnValue(JSON.stringify({ columns: [], filters: {} }));

    const colDefs = [{ field: 'name', hide: false }];
    expect(getColumnVisibilityFromGridState(ApplicationRoute.Models, colDefs)).toBeNull();
  });

  test('should apply stored hide values to columnDefs', () => {
    const storedModel = {
      columns: [
        { colId: 'name', hide: false },
        { colId: 'status', hide: true },
      ],
      filters: {},
    };
    vi.mocked(getFromLocalStorage).mockReturnValue(JSON.stringify(storedModel));

    const colDefs = [
      { field: 'name', hide: false, headerName: 'Name' },
      { field: 'status', hide: false, headerName: 'Status' },
    ];
    const result = getColumnVisibilityFromGridState(ApplicationRoute.Models, colDefs);

    expect(result).toEqual([
      { field: 'name', hide: false, headerName: 'Name' },
      { field: 'status', hide: true, headerName: 'Status' },
    ]);
  });

  test('should keep columnDef hide value when column not in storage', () => {
    const storedModel = {
      columns: [{ colId: 'name', hide: true }],
      filters: {},
    };
    vi.mocked(getFromLocalStorage).mockReturnValue(JSON.stringify(storedModel));

    const colDefs = [
      { field: 'name', hide: false },
      { field: 'newColumn', hide: false },
    ];
    const result = getColumnVisibilityFromGridState(ApplicationRoute.Models, colDefs);

    expect(result![0].hide).toBe(true);
    expect(result![1].hide).toBe(false);
  });
});
