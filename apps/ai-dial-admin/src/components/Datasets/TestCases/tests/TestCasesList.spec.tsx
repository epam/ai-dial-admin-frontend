import { render, waitFor, act } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import TestCasesList, { DatasetTestCasesActions } from '../TestCasesList';
import { Dataset, DatasetTestCase } from '@/src/models/evaluation/dataset';
import * as actions from '@/src/app/[lang]/datasets/actions';

const createPageData = (content: Partial<DatasetTestCase>[]) => ({
  page: 0,
  size: 1000,
  totalElements: content.length,
  totalPages: 1,
  content: content as DatasetTestCase[],
});

let capturedGridOptions: any = null;
let capturedOnCellChange: ((data: Record<string, unknown>, field: string, value: unknown) => void) | null = null;
let capturedRowData: any[] | null = null;
let capturedOnGridReady: ((event: { api: any }) => void) | null = null;
let capturedTurnHandlers: any = null;
let capturedOnToggleExpand: ((groupKey: string) => void) | null = null;

vi.mock('@/src/app/[lang]/datasets/actions', () => ({
  getTestCases: vi.fn(),
  createTestCase: vi.fn(),
  importTestCase: vi.fn(),
  removeTestCase: vi.fn(),
  removeMultipleTestCases: vi.fn(),
  getDataset: vi.fn(),
}));

vi.mock('@/src/components/ListView/List', () => ({
  default: ({ listLabel, emptyDataProps, onGridReady, additionalGridOptions, rowData, children }: any) => {
    capturedGridOptions = additionalGridOptions;
    capturedRowData = rowData ?? null;
    capturedOnGridReady = onGridReady;
    return (
      <div>
        <div>List View Component</div>
        <div>Title: {listLabel}</div>
        <div>Empty Title: {emptyDataProps?.title}</div>
        <div>{children}</div>
      </div>
    );
  },
}));

vi.mock('@/src/components/Datasets/utils/columns', () => ({
  getDatasetTestCaseColumns: (_dataset: unknown, onCellChange: any, _t: unknown, onToggleExpand: any) => {
    capturedOnCellChange = onCellChange;
    capturedOnToggleExpand = onToggleExpand;
    return [];
  },
}));

vi.mock('@/src/components/TestSuites/utils/grouped-columns', () => ({
  getTurnActionsColumn: (handlers: any) => {
    capturedTurnHandlers = handlers;
    return { colId: 'action-turns' };
  },
}));

vi.mock('@/src/components/Datasets/TestCases/Header', () => ({
  default: () => <div>Header Buttons</div>,
}));

describe('DatasetTestCasesList', () => {
  const mockDataset: Dataset = { id: 'dataset-123', name: 'Dataset 1' };
  const mockOnDirtyChange = vi.fn();

  const mockTestCases: Partial<DatasetTestCase>[] = [
    { id: 'tc-1', testCaseName: 'Test Case 1', createdAt: 0 },
    { id: 'tc-2', testCaseName: 'Test Case 2', createdAt: 0 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    capturedGridOptions = null;
    capturedOnCellChange = null;
    capturedRowData = null;
    capturedOnGridReady = null;
    capturedTurnHandlers = null;
    capturedOnToggleExpand = null;
  });

  test('fetches test cases on mount using dataset id', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(createPageData(mockTestCases));

    render(<TestCasesList dataset={mockDataset} />);

    await waitFor(() => {
      expect(actions.getTestCases).toHaveBeenCalledWith('dataset-123', 0, 1000, [], []);
    });
  });

  test('handles null response from getTestCases gracefully', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(null as any);

    render(<TestCasesList dataset={mockDataset} />);

    await waitFor(() => {
      expect(actions.getTestCases).toHaveBeenCalled();
    });
  });

  test('refetches when dataset schema changes', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(createPageData([]));

    const { rerender } = render(<TestCasesList dataset={mockDataset} />);

    await waitFor(() => expect(actions.getTestCases).toHaveBeenCalledTimes(1));

    rerender(
      <TestCasesList
        dataset={{
          ...mockDataset,
          testCaseSchema: [{ name: 'foo', type: 'STRING' as any, required: false, description: '' }],
        }}
      />,
    );

    await waitFor(() => expect(actions.getTestCases).toHaveBeenCalledTimes(2));
  });

  test('clearDirtyAndRefresh clears dirty rows and calls onDirtyChange(false)', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(
      createPageData([{ id: 'row-1', testCaseName: 'tc', createdAt: 0, data: { foo: 'a' } }]),
    );
    const actionsRef = createRef<DatasetTestCasesActions | null>();
    render(<TestCasesList dataset={mockDataset} testCasesActionsRef={actionsRef} onDirtyChange={mockOnDirtyChange} />);

    await waitFor(() => expect(capturedRowData).not.toBeNull());
    await waitFor(() => expect(capturedRowData!.length).toBe(1));

    capturedOnCellChange!(capturedRowData![0], 'testCaseName', 'changed');

    expect(actionsRef.current?.getDirtyTestCases().length).toBeGreaterThan(0);

    actionsRef.current?.clearDirtyAndRefresh();

    expect(actionsRef.current?.getDirtyTestCases().length).toBe(0);
    expect(mockOnDirtyChange).toHaveBeenLastCalledWith(false);
  });
});

describe('DatasetTestCasesList — multi-turn grouping', () => {
  // `foo` is per-turn, so it round-trips through `multiTurnData`; shared `data` stays empty.
  const mockDataset: Dataset = {
    id: 'dataset-123',
    name: 'Dataset 1',
    testCaseSchema: [{ name: 'foo', type: 'STRING' as any, required: false, description: '', perTurn: true }],
  };
  const mockOnDirtyChange = vi.fn();

  const makeLiveGridApi = () => ({
    setGridOption: vi.fn(),
    refreshClientSideRowModel: vi.fn(),
    refreshCells: vi.fn(),
    forEachNode: vi.fn((cb: (node: any) => void) => (capturedRowData ?? []).forEach((data: any) => cb({ data }))),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    capturedGridOptions = null;
    capturedOnCellChange = null;
    capturedRowData = null;
    capturedOnGridReady = null;
    capturedTurnHandlers = null;
    capturedOnToggleExpand = null;
  });

  const renderList = (dataset: Dataset) => {
    const actionsRef = createRef<DatasetTestCasesActions | null>();
    render(<TestCasesList dataset={dataset} testCasesActionsRef={actionsRef} onDirtyChange={mockOnDirtyChange} />);
    return actionsRef;
  };

  /** Loads a real 2-turn case through the real projection and expands its group, returning the
   * live GROUP row's key and both projected TURN rows — exercises the actual
   * `useTurnGroupProjection` output rather than hand-built grid rows. */
  const setUpExpandedTwoTurnCase = async (dataset: Dataset) => {
    vi.mocked(actions.getTestCases).mockResolvedValue(
      createPageData([{ id: 'tc-1', testCaseName: 'Case', createdAt: 0, multiTurnData: [{ foo: 'a' }, { foo: 'b' }] }]),
    );
    const actionsRef = renderList(dataset);

    await waitFor(() => expect(capturedRowData).not.toBeNull());
    await waitFor(() => expect(capturedRowData!.length).toBe(1)); // collapsed by default: GROUP row only
    expect(capturedOnToggleExpand).not.toBeNull();

    const groupKey = (capturedRowData!.find((r: any) => r.rowType === 'GROUP') as any).groupKey as string;
    act(() => capturedOnToggleExpand!(groupKey));
    await waitFor(() => expect(capturedRowData!.length).toBe(3)); // GROUP + 2 TURN rows

    const turn0 = capturedRowData!.find((r: any) => r.rowType === 'TURN' && r.turnNumber === 1);
    const turn1 = capturedRowData!.find((r: any) => r.rowType === 'TURN' && r.turnNumber === 2);
    return { actionsRef, groupKey, turn0, turn1 };
  };

  test("editing a TURN row's cell writes into the authoritative row's data, never lets _turnIndex leak into data", async () => {
    const { actionsRef, turn0 } = await setUpExpandedTwoTurnCase(mockDataset);

    capturedOnCellChange!(turn0, 'foo', 'edited');
    // Editing the client-only `_turnIndex` field itself must never leak into `.data`.
    capturedOnCellChange!(turn0, '_turnIndex', 7);

    const dirty = actionsRef.current!.getDirtyTestCases();
    expect(dirty).toHaveLength(1);
    expect(dirty[0].multiTurnData).toHaveLength(2);
    const editedTurn = dirty[0].multiTurnData!.find((t: any) => t.foo === 'edited');
    expect(editedTurn).toBeTruthy();
    expect('_turnIndex' in (editedTurn as object)).toBe(false);
  });

  test('editing turn 0, then COLLAPSING the group, preserves the edit in getDirtyTestCases()', async () => {
    const { actionsRef, groupKey, turn0 } = await setUpExpandedTwoTurnCase(mockDataset);

    capturedOnCellChange!(turn0, 'foo', 'edited');

    act(() => capturedOnToggleExpand!(groupKey)); // collapse
    await waitFor(() => expect(capturedRowData!.length).toBe(1));

    const dirty = actionsRef.current!.getDirtyTestCases();
    expect(dirty).toHaveLength(1);
    expect(dirty[0].data).toEqual({});
    expect(dirty[0].multiTurnData).toEqual([{ foo: 'edited' }, { foo: 'b' }]);
  });

  test('an edit survives toggling expand/collapse multiple times before save', async () => {
    const { actionsRef, groupKey, turn0 } = await setUpExpandedTwoTurnCase(mockDataset);

    capturedOnCellChange!(turn0, 'foo', 'edited');

    act(() => capturedOnToggleExpand!(groupKey)); // collapse
    await waitFor(() => expect(capturedRowData!.length).toBe(1));
    act(() => capturedOnToggleExpand!(groupKey)); // expand again
    await waitFor(() => expect(capturedRowData!.length).toBe(3));

    const reprojectedTurn0 = capturedRowData!.find((r: any) => r.rowType === 'TURN' && r.turnNumber === 1);
    expect(reprojectedTurn0.data).toEqual({ foo: 'edited' });

    act(() => capturedOnToggleExpand!(groupKey)); // collapse again, then save
    await waitFor(() => expect(capturedRowData!.length).toBe(1));

    const dirty = actionsRef.current!.getDirtyTestCases();
    expect(dirty).toHaveLength(1);
    expect(dirty[0].multiTurnData).toEqual([{ foo: 'edited' }, { foo: 'b' }]);
  });

  test('getRowId returns distinct ids for a GROUP row and each of its TURN rows', async () => {
    await setUpExpandedTwoTurnCase(mockDataset);

    const groupRow = capturedRowData!.find((r: any) => r.rowType === 'GROUP');
    const turnRows = capturedRowData!.filter((r: any) => r.rowType === 'TURN');
    expect(turnRows).toHaveLength(2);

    const ids = [groupRow, ...turnRows].map((row: any) => capturedGridOptions.getRowId({ data: row }));
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('Add turn on a single case makes getDirtyTestCases() return a multiTurnData DTO (no data)', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(
      createPageData([{ id: 'tc-1', testCaseName: 'Case', createdAt: 0, data: { foo: 'a' } }]),
    );
    const actionsRef = renderList(mockDataset);

    await waitFor(() => expect(capturedRowData).not.toBeNull());
    capturedOnGridReady?.({ api: makeLiveGridApi() });
    await waitFor(() => expect(capturedRowData!.length).toBe(1));
    expect(capturedTurnHandlers).not.toBeNull();

    act(() => {
      capturedTurnHandlers.onAddTurn('tc-1');
    });

    // Expanded group: GROUP summary row + its 2 turn rows.
    await waitFor(() => expect(capturedRowData!.length).toBe(3));

    const dirty = actionsRef.current!.getDirtyTestCases();
    expect(dirty).toHaveLength(1);
    expect(dirty[0].data).toEqual({});
    expect(dirty[0].multiTurnData).toHaveLength(2);
    expect(dirty[0].multiTurnData![0]).toEqual({ foo: 'a' });
    expect(dirty[0].multiTurnData![1]).toEqual({});
  });

  test('removing down to one turn returns a single-turn data DTO', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(
      createPageData([{ id: 'tc-1', testCaseName: 'Case', createdAt: 0, multiTurnData: [{ foo: 'a' }, { foo: 'b' }] }]),
    );
    const actionsRef = renderList(mockDataset);

    await waitFor(() => expect(capturedRowData).not.toBeNull());
    capturedOnGridReady?.({ api: makeLiveGridApi() });
    await waitFor(() => expect(capturedRowData!.length).toBeGreaterThan(0));

    const groupRow = capturedRowData!.find((r: any) => r.rowType === 'GROUP');
    expect(groupRow).toBeTruthy();
    const turnToRemove = { ...groupRow.turns[1], groupKey: 'tc-1' };

    act(() => {
      capturedTurnHandlers.onDeleteTurn(turnToRemove);
    });

    await waitFor(() => expect(capturedRowData!.some((r: any) => r.rowType === 'SINGLE')).toBe(true));

    const dirty = actionsRef.current!.getDirtyTestCases();
    expect(dirty).toHaveLength(1);
    expect(dirty[0].multiTurnData).toBeUndefined();
    expect(dirty[0].data).toEqual({ foo: 'a' });
  });
});
