import { render, waitFor, act } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import TestCasesList, { TestCasesActions } from '../TestCasesList';
import { TestSuite, TestCase as TestCaseModel } from '@/src/models/evaluation/test-suite';
import * as actions from '@/src/app/[lang]/datasets/actions';

type TestCase = Partial<TestCaseModel>;

const createPageData = (content: TestCase[]) => ({
  page: 0,
  size: 1000,
  totalElements: content.length,
  totalPages: 1,
  content: content as TestCaseModel[],
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

vi.mock('@/src/components/TestSuites/utils/columns', () => ({
  getTestCaseColumns: (
    _suite: unknown,
    onCellChange: any,
    _t: unknown,
    _schema: unknown,
    _isReadOnly: unknown,
    onToggleExpand: any,
  ) => {
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

vi.mock('@/src/components/TestSuites/TestCases/Header', () => ({
  default: ({ selectedTestSuiteId }: any) => (
    <div>
      <div>Header Buttons</div>
      <div>Test Suite ID: {selectedTestSuiteId}</div>
    </div>
  ),
}));

describe('TestCasesList', () => {
  const mockTestSuite: TestSuite = {
    id: 'test-suite-123',
    name: 'Test Suite 1',
    datasetId: 'dataset-123',
  };

  const mockTestCases: TestCase[] = [
    { id: 'tc-1', testCaseName: 'Test Case 1', createdAt: 0 },
    { id: 'tc-2', testCaseName: 'Test Case 2', createdAt: 0 },
  ];

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    capturedGridOptions = null;
    capturedOnCellChange = null;
    capturedRowData = null;
    capturedOnGridReady = null;
  });

  test('fetches test cases on mount using datasetId', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(createPageData(mockTestCases));

    render(<TestCasesList selectedTestSuite={mockTestSuite} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(actions.getTestCases).toHaveBeenCalledWith('dataset-123', 0, 1000, [], []);
    });
  });

  test('does not fetch when datasetId is missing', async () => {
    const suiteNoDataset: TestSuite = { id: 'suite-1', name: 'Suite' };
    render(<TestCasesList selectedTestSuite={suiteNoDataset} onChange={mockOnChange} />);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(actions.getTestCases).not.toHaveBeenCalled();
  });

  test('handles null response from getTestCases gracefully', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(null as any);

    render(<TestCasesList selectedTestSuite={mockTestSuite} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(actions.getTestCases).toHaveBeenCalled();
    });
  });

  test('refetches when datasetId changes', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(createPageData([]));

    const { rerender } = render(<TestCasesList selectedTestSuite={mockTestSuite} onChange={mockOnChange} />);

    await waitFor(() => expect(actions.getTestCases).toHaveBeenCalledTimes(1));

    rerender(
      <TestCasesList selectedTestSuite={{ ...mockTestSuite, datasetId: 'dataset-456' }} onChange={mockOnChange} />,
    );

    await waitFor(() => expect(actions.getTestCases).toHaveBeenCalledTimes(2));
    expect(actions.getTestCases).toHaveBeenLastCalledWith('dataset-456', 0, 1000, [], []);
  });
});

describe('TestCasesList — disabledTestCaseIds logic', () => {
  const mockOnChange = vi.fn();
  const mockOnDirtyChange = vi.fn();

  const makeColumn = (colId: string) => ({ getColId: () => colId });
  const makeCellEvent = (colId: string, rowData: Record<string, unknown>, newValue: unknown) => ({
    column: makeColumn(colId),
    data: rowData,
    newValue,
    node: {},
  });

  const makeGridApi = (nodes: { data: Record<string, unknown>; rowPinned?: string }[]) => ({
    setGridOption: vi.fn(),
    refreshClientSideRowModel: vi.fn(),
    refreshCells: vi.fn(),
    forEachNode: vi.fn((cb: (node: any) => void) => nodes.forEach(cb)),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    capturedGridOptions = null;
    capturedOnCellChange = null;
    capturedRowData = null;
    capturedOnGridReady = null;
    vi.mocked(actions.getTestCases).mockResolvedValue({
      page: 0,
      size: 1000,
      totalElements: 0,
      totalPages: 0,
      content: [],
    });
  });

  const renderList = (suite: TestSuite) => {
    const actionsRef = createRef<TestCasesActions | null>();
    render(
      <TestCasesList
        selectedTestSuite={suite}
        onChange={mockOnChange}
        testCasesActionsRef={actionsRef}
        onDirtyChange={mockOnDirtyChange}
      />,
    );
    return actionsRef;
  };

  test('toggling enabled OFF adds row id to disabledTestCaseIds via onChange', async () => {
    const suite: TestSuite = { id: 'suite-1', datasetId: 'ds-1', disabledTestCaseIds: [] };
    renderList(suite);

    await waitFor(() => expect(capturedGridOptions).not.toBeNull());

    const row = { id: 'row-1', testCaseName: 'tc', createdAt: 0 };
    // Initialize grid with a node showing the row as disabled (ag-grid updates node data before firing the event)
    capturedOnGridReady?.({ api: makeGridApi([{ data: { ...row, enabled: false } }]) });

    capturedGridOptions.onCellValueChanged(makeCellEvent('enabled', row, false));

    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ disabledTestCaseIds: ['row-1'] }), true);
  });

  test('toggling enabled ON removes row id from disabledTestCaseIds via onChange', async () => {
    const suite: TestSuite = {
      id: 'suite-1',
      datasetId: 'ds-1',
      disabledTestCaseIds: ['row-1'],
    };
    renderList(suite);

    await waitFor(() => expect(capturedGridOptions).not.toBeNull());

    const row = { id: 'row-1', testCaseName: 'tc', createdAt: 0 };
    // Initialize grid with a node showing the row as enabled (ag-grid updates node data before firing the event)
    capturedOnGridReady?.({ api: makeGridApi([{ data: { ...row, enabled: true } }]) });

    capturedGridOptions.onCellValueChanged(makeCellEvent('enabled', row, true));

    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ disabledTestCaseIds: [] }), true);
  });

  test('disabled state is pre-populated from disabledTestCaseIds when data loads', async () => {
    const suite: TestSuite = {
      id: 'suite-1',
      datasetId: 'ds-1',
      disabledTestCaseIds: ['row-1'],
    };

    vi.mocked(actions.getTestCases).mockResolvedValue(
      createPageData([
        { id: 'row-1', testCaseName: 'disabled case', createdAt: 0 },
        { id: 'row-2', testCaseName: 'enabled case', createdAt: 0 },
      ]),
    );

    renderList(suite);

    await waitFor(() => {
      expect(capturedRowData).not.toBeNull();
      expect(capturedRowData!.length).toBe(2);
    });

    const row1 = capturedRowData!.find((r: any) => r.id === 'row-1');
    const row2 = capturedRowData!.find((r: any) => r.id === 'row-2');

    expect(row1?.enabled).toBe(false);
    expect(row2?.enabled).toBe(true);
  });

  test('clearDirtyAndRefresh clears dirty rows and calls onDirtyChange(false)', async () => {
    const suite: TestSuite = { id: 'suite-1', datasetId: 'ds-1', disabledTestCaseIds: [] };
    vi.mocked(actions.getTestCases).mockResolvedValue(
      createPageData([{ id: 'row-1', testCaseName: 'tc', createdAt: 0 }]),
    );
    const actionsRef = renderList(suite);

    await waitFor(() => expect(capturedRowData).not.toBeNull());
    await waitFor(() => expect(capturedRowData!.length).toBe(1));
    capturedOnGridReady?.({ api: makeGridApi([{ data: capturedRowData![0] }]) });

    capturedOnCellChange!(capturedRowData![0], 'testCaseName', 'changed');

    expect(actionsRef.current?.getDirtyTestCases().length).toBeGreaterThan(0);

    actionsRef.current?.clearDirtyAndRefresh();

    expect(actionsRef.current?.getDirtyTestCases().length).toBe(0);
    expect(mockOnDirtyChange).toHaveBeenLastCalledWith(false);
  });
});

describe('TestCasesList — multi-turn grouping', () => {
  const mockOnChange = vi.fn();
  const mockOnDirtyChange = vi.fn();

  const makeGridApi = (nodes: { data: Record<string, unknown> }[]) => ({
    setGridOption: vi.fn(),
    refreshClientSideRowModel: vi.fn(),
    refreshCells: vi.fn(),
    forEachNode: vi.fn((cb: (node: any) => void) => nodes.forEach(cb)),
  });

  // Mirrors real ag-grid: reads whatever the mocked grid last rendered, so it reflects
  // structural changes (add/remove/reorder turn) made via setData without manual re-wiring.
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

  const renderList = (suite: TestSuite) => {
    const actionsRef = createRef<TestCasesActions | null>();
    render(
      <TestCasesList
        selectedTestSuite={suite}
        onChange={mockOnChange}
        testCasesActionsRef={actionsRef}
        onDirtyChange={mockOnDirtyChange}
        dataset={null}
      />,
    );
    return actionsRef;
  };

  /** Loads a real 2-turn case through the real projection and expands its group, returning the
   * live GROUP row's key and both projected TURN rows — used by the tests below so edits and
   * `getRowId` are exercised against the actual `useTurnGroupProjection` output, not hand-built
   * grid rows. */
  const setUpExpandedTwoTurnCase = async (suite: TestSuite) => {
    vi.mocked(actions.getTestCases).mockResolvedValue(
      createPageData([{ id: 'tc-1', testCaseName: 'Case', createdAt: 0, multiTurnData: [{ foo: 'a' }, { foo: 'b' }] }]),
    );
    const actionsRef = renderList(suite);

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
    const suite: TestSuite = { id: 'suite-1', datasetId: 'ds-1', disabledTestCaseIds: [] };
    const { actionsRef, turn0 } = await setUpExpandedTwoTurnCase(suite);

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

  test('editing turn 0, then COLLAPSING the group, preserves the edit in getDirtyTestCases() (Critical 1 regression)', async () => {
    const suite: TestSuite = { id: 'suite-1', datasetId: 'ds-1', disabledTestCaseIds: [] };
    const { actionsRef, groupKey, turn0 } = await setUpExpandedTwoTurnCase(suite);

    capturedOnCellChange!(turn0, 'foo', 'edited');

    act(() => capturedOnToggleExpand!(groupKey)); // collapse
    await waitFor(() => expect(capturedRowData!.length).toBe(1));

    const dirty = actionsRef.current!.getDirtyTestCases();
    expect(dirty).toHaveLength(1);
    expect(dirty[0].data).toBeUndefined();
    expect(dirty[0].multiTurnData).toEqual([{ foo: 'edited' }, { foo: 'b' }]);
  });

  test('an edit survives toggling expand/collapse multiple times before save (Important 3)', async () => {
    const suite: TestSuite = { id: 'suite-1', datasetId: 'ds-1', disabledTestCaseIds: [] };
    const { actionsRef, groupKey, turn0 } = await setUpExpandedTwoTurnCase(suite);

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

  test('getRowId returns distinct ids for a GROUP row and each of its TURN rows (Fix A)', async () => {
    const suite: TestSuite = { id: 'suite-1', datasetId: 'ds-1', disabledTestCaseIds: [] };
    await setUpExpandedTwoTurnCase(suite);

    const groupRow = capturedRowData!.find((r: any) => r.rowType === 'GROUP');
    const turnRows = capturedRowData!.filter((r: any) => r.rowType === 'TURN');
    expect(turnRows).toHaveLength(2);

    const ids = [groupRow, ...turnRows].map((row: any) => capturedGridOptions.getRowId({ data: row }));
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('Add turn on a single case makes getDirtyTestCases() return a multiTurnData DTO (no data)', async () => {
    const suite: TestSuite = { id: 'suite-1', datasetId: 'ds-1', disabledTestCaseIds: [] };
    vi.mocked(actions.getTestCases).mockResolvedValue(
      createPageData([{ id: 'tc-1', testCaseName: 'Case', createdAt: 0, data: { foo: 'a' } }]),
    );
    const actionsRef = renderList(suite);

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
    expect(dirty[0].data).toBeUndefined();
    expect(dirty[0].multiTurnData).toHaveLength(2);
    expect(dirty[0].multiTurnData![0]).toEqual({ foo: 'a' });
    expect(dirty[0].multiTurnData![1]).toEqual({});
  });

  test('removing down to one turn returns a single-turn data DTO', async () => {
    const suite: TestSuite = { id: 'suite-1', datasetId: 'ds-1', disabledTestCaseIds: [] };
    vi.mocked(actions.getTestCases).mockResolvedValue(
      createPageData([{ id: 'tc-1', testCaseName: 'Case', createdAt: 0, multiTurnData: [{ foo: 'a' }, { foo: 'b' }] }]),
    );
    const actionsRef = renderList(suite);

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
