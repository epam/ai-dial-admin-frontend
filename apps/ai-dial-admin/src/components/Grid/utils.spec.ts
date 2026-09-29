import { ColDef } from 'ag-grid-community';
import { ApplicationRoute } from '@/src/types/routes';
import { getFromLocalStorage, setToLocalStorage } from '@/src/utils/local-storage';
import {
  updateColumnPanelStateInStorage,
  getColumnVisibilityFromGridState,
  applyColumnStateOrderToColDefs,
  haveColDefsSamePanelState,
  applyColumnStateOrderToTreeColDefs,
  haveTreeColDefsSamePanelState,
} from './utils';
import { GRID_COLUMNS_KEY } from './constants';
import { describe, expect, test, vi, beforeEach } from 'vitest';

vi.mock('@/src/utils/local-storage', () => ({
  setToLocalStorage: vi.fn(),
  getFromLocalStorage: vi.fn(() => null),
}));

describe('Grid :: updateColumnPanelStateInStorage', () => {
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
    updateColumnPanelStateInStorage(ApplicationRoute.Models, colDefs);

    expect(setToLocalStorage).toHaveBeenCalledWith(`${GRID_COLUMNS_KEY}${ApplicationRoute.Models}`, expect.any(String));
    const saved = JSON.parse(vi.mocked(setToLocalStorage).mock.calls[0][1] as string);
    expect(saved.columns[0].hide).toBe(false);
    expect(saved.columns[1].hide).toBe(true);
    expect(saved.columns[1].width).toBe(150);
  });

  test('should handle empty storage gracefully', () => {
    vi.mocked(getFromLocalStorage).mockReturnValue(null);

    const colDefs = [{ field: 'name', hide: true }];
    updateColumnPanelStateInStorage(ApplicationRoute.Models, colDefs);

    expect(setToLocalStorage).toHaveBeenCalled();
  });
});

describe('Grid :: updateColumnPanelStateInStorage :: order', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const savedColumns = () => JSON.parse(vi.mocked(setToLocalStorage).mock.calls[0][1] as string).columns;

  test('stores the columns in the order the panel lists them', () => {
    vi.mocked(getFromLocalStorage).mockReturnValue(
      JSON.stringify({ columns: [{ colId: 'name', width: 200 }, { colId: 'status' }], filters: {} }),
    );

    updateColumnPanelStateInStorage(ApplicationRoute.Models, [{ field: 'status' }, { field: 'name' }]);

    expect(savedColumns()).toEqual([
      { colId: 'status', hide: undefined },
      { colId: 'name', width: 200, hide: undefined },
    ]);
  });

  test('keeps a column the panel does not list in its stored position', () => {
    vi.mocked(getFromLocalStorage).mockReturnValue(
      JSON.stringify({ columns: [{ colId: 'name' }, { colId: 'status' }, { colId: 'actions' }], filters: {} }),
    );

    updateColumnPanelStateInStorage(ApplicationRoute.Models, [{ field: 'status' }, { field: 'name' }]);

    expect(savedColumns().map((col: { colId: string }) => col.colId)).toEqual(['status', 'name', 'actions']);
  });

  test('writes the panel order when the grid has not saved its state yet', () => {
    vi.mocked(getFromLocalStorage).mockReturnValue(null);

    updateColumnPanelStateInStorage(ApplicationRoute.Models, [{ field: 'status' }, { field: 'name', hide: true }]);

    expect(savedColumns()).toEqual([
      { colId: 'status', hide: undefined },
      { colId: 'name', hide: true },
    ]);
  });
});

describe('Grid :: updateColumnPanelStateInStorage :: grouped order', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('reorders inside a group and leaves the other group in place', () => {
    vi.mocked(getFromLocalStorage).mockReturnValue(
      JSON.stringify({ columns: [{ colId: 'a' }, { colId: 'b' }, { colId: 'c' }], filters: {} }),
    );
    const grouped = [
      { groupId: 'left', children: [{ field: 'b' }, { field: 'a' }] },
      { groupId: 'right', children: [{ field: 'c' }] },
    ] as unknown as ColDef[];

    updateColumnPanelStateInStorage(ApplicationRoute.Models, grouped);

    const saved = JSON.parse(vi.mocked(setToLocalStorage).mock.calls[0][1] as string);
    expect(saved.columns.map((col: { colId: string }) => col.colId)).toEqual(['b', 'a', 'c']);
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

  test('should apply stored column order to columnDefs', () => {
    const storedModel = {
      columns: [
        { colId: 'status', hide: false },
        { colId: 'name', hide: false },
      ],
      filters: {},
    };
    vi.mocked(getFromLocalStorage).mockReturnValue(JSON.stringify(storedModel));

    const colDefs = [
      { field: 'name', hide: false, headerName: 'Name' },
      { field: 'status', hide: false, headerName: 'Status' },
    ];
    const result = getColumnVisibilityFromGridState(ApplicationRoute.Models, colDefs);

    expect(result?.map((col) => col.field)).toEqual(['status', 'name']);
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

describe('Grid :: applyColumnStateOrderToColDefs', () => {
  test('should reorder columnDefs to match column state', () => {
    const colDefs = [
      { field: 'name', hide: false, headerName: 'Name' },
      { field: 'status', hide: false, headerName: 'Status' },
    ];

    const result = applyColumnStateOrderToColDefs(colDefs, [
      { colId: 'status', hide: true },
      { colId: 'name', hide: false },
    ]);

    expect(result).toEqual([
      { field: 'status', hide: true, headerName: 'Status' },
      { field: 'name', hide: false, headerName: 'Name' },
    ]);
  });
});

describe('Grid :: haveColDefsSamePanelState', () => {
  test('should return true when order and visibility match', () => {
    const colDefs = [
      { field: 'name', hide: false },
      { field: 'status', hide: true },
    ];

    expect(haveColDefsSamePanelState(colDefs, [...colDefs])).toBe(true);
  });

  test('should return false when order differs', () => {
    const colDefs = [
      { field: 'name', hide: false },
      { field: 'status', hide: false },
    ];

    expect(
      haveColDefsSamePanelState(colDefs, [
        { field: 'status', hide: false },
        { field: 'name', hide: false },
      ]),
    ).toBe(false);
  });
});

describe('Grid :: applyColumnStateOrderToTreeColDefs', () => {
  test('should reorder flat columns by colId', () => {
    const colDefs = [
      { field: 'name', headerName: 'Name' },
      { field: 'status', headerName: 'Status' },
    ];

    const result = applyColumnStateOrderToTreeColDefs(colDefs, [{ colId: 'status' }, { colId: 'name' }]);

    expect(result.map((c) => c.field)).toEqual(['status', 'name']);
  });

  test('should prefer colId over field when both are set', () => {
    const colDefs = [
      { field: 'executionStatus', colId: 'status', headerName: 'Status' },
      { field: 'testCaseName', colId: 'testCaseName', headerName: 'Name' },
    ];

    const result = applyColumnStateOrderToTreeColDefs(colDefs, [{ colId: 'testCaseName' }, { colId: 'status' }]);

    expect(result.map((c) => c.colId)).toEqual(['testCaseName', 'status']);
  });

  test('should reorder group columns by first child colId', () => {
    const details = {
      headerName: 'Details',
      context: { panelName: 'Details' },
      children: [
        { field: 'executionStatus', colId: 'status' },
        { field: 'testCaseName', colId: 'testCaseName' },
      ],
    };
    const metrics = {
      headerName: 'Metrics',
      children: [{ field: 'accuracy' }, { field: 'bleu' }],
    };

    const result = applyColumnStateOrderToTreeColDefs(
      [details, metrics],
      [{ colId: 'accuracy' }, { colId: 'bleu' }, { colId: 'status' }, { colId: 'testCaseName' }],
    );

    expect(result.map((c) => c.headerName)).toEqual(['Metrics', 'Details']);
  });

  test('should place columns not in state at the end, preserving relative order', () => {
    const colDefs = [
      { field: 'missing', headerName: 'Missing' },
      { field: 'name', headerName: 'Name' },
    ];

    const result = applyColumnStateOrderToTreeColDefs(colDefs, [{ colId: 'name' }]);

    expect(result.map((c) => c.field)).toEqual(['name', 'missing']);
  });

  test('should not mutate the original array', () => {
    const colDefs = [
      { field: 'b', headerName: 'B' },
      { field: 'a', headerName: 'A' },
    ];
    const original = [...colDefs];

    applyColumnStateOrderToTreeColDefs(colDefs, [{ colId: 'a' }, { colId: 'b' }]);

    expect(colDefs).toEqual(original);
  });
});

describe('Grid :: haveTreeColDefsSamePanelState', () => {
  test('should return true when order matches for flat columns', () => {
    const colDefs = [{ field: 'name' }, { field: 'status' }];

    expect(haveTreeColDefsSamePanelState(colDefs, [...colDefs])).toBe(true);
  });

  test('should return false when order differs for flat columns', () => {
    expect(
      haveTreeColDefsSamePanelState([{ field: 'name' }, { field: 'status' }], [{ field: 'status' }, { field: 'name' }]),
    ).toBe(false);
  });

  test('should return true when group order matches', () => {
    const details = { headerName: 'Details', children: [{ field: 'executionStatus', colId: 'status' }] };
    const metrics = { headerName: 'Metrics', children: [{ field: 'accuracy' }] };

    expect(haveTreeColDefsSamePanelState([details, metrics], [details, metrics])).toBe(true);
  });

  test('should return false when group order differs', () => {
    const details = { headerName: 'Details', children: [{ field: 'executionStatus', colId: 'status' }] };
    const metrics = { headerName: 'Metrics', children: [{ field: 'accuracy' }] };

    expect(haveTreeColDefsSamePanelState([details, metrics], [metrics, details])).toBe(false);
  });

  test('should return false when lengths differ', () => {
    const colDefs = [{ field: 'name' }, { field: 'status' }];

    expect(haveTreeColDefsSamePanelState(colDefs, [{ field: 'name' }])).toBe(false);
  });
});
