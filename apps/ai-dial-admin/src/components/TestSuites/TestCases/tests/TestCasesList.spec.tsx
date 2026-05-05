import { render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import TestCasesList, { TestCasesActions } from '../TestCasesList';
import { TestSuite, TestCase as TestCaseModel } from '@/src/models/evaluation/test-suite';
import * as actions from '@/src/app/[lang]/test-suites/actions';

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

// Mock the actions
vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getTestCases: vi.fn(),
  createTestCase: vi.fn(),
  importTestCase: vi.fn(),
  removeTestCase: vi.fn(),
}));

// Mock ListView component — captures additionalGridOptions and onGridReady
vi.mock('@/src/components/ListView/List', () => ({
  default: ({ listLabel, emptyDataProps, onGridReady, additionalGridOptions, children }: any) => {
    capturedGridOptions = additionalGridOptions;
    return (
      <div>
        <div>List View Component</div>
        <div>Title: {listLabel}</div>
        <div>Empty Title: {emptyDataProps?.title}</div>
        <button onClick={() => onGridReady({ api: { setGridOption: vi.fn(), refreshClientSideRowModel: vi.fn() } })}>
          Initialize Grid
        </button>
        <div>{children}</div>
      </div>
    );
  },
}));

// Mock getTestCaseColumns to capture onCellChange
vi.mock('@/src/components/TestSuites/utils/columns', () => ({
  getTestCaseColumns: (_suite: unknown, onCellChange: any) => {
    capturedOnCellChange = onCellChange;
    return [];
  },
}));

// Mock HeaderButtons component
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
    description: 'Test description',
  };

  const mockTestCases: TestCase[] = [
    {
      testCaseName: 'Test Case 1',
      data: {
        temperature: 0.7,
      },
    },
    {
      testCaseName: 'Test Case 2',
      data: {
        temperature: 0.5,
      },
    },
  ];

  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('fetches test cases on mount', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(createPageData(mockTestCases));

    render(<TestCasesList selectedTestSuite={mockTestSuite} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(actions.getTestCases).toHaveBeenCalledWith(mockTestSuite.id, 0, 1000, [], []);
    });
  });
  test('handles null response from getTestCases', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(null as any);

    render(<TestCasesList selectedTestSuite={mockTestSuite} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(actions.getTestCases).toHaveBeenCalled();
    });
  });

  test('initializes grid when onGridReady is called', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(createPageData(mockTestCases));

    render(<TestCasesList selectedTestSuite={mockTestSuite} onChange={mockOnChange} />);

    const initButton = await screen.findByText('Initialize Grid');
    initButton.click();

    // Grid initialization should complete without errors
    expect(initButton).toBeInTheDocument();
  });

  test('handles test suite without id', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(createPageData([]));

    const testSuiteNoId: TestSuite = {
      name: 'Test Suite',
    };

    render(<TestCasesList selectedTestSuite={testSuiteNoId} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(actions.getTestCases).toHaveBeenCalledWith(undefined, 0, 1000, [], []);
    });
  });

  test('handles multiple test cases with different facts', async () => {
    const testCasesWithDifferentFacts: TestCase[] = [
      {
        testCaseName: 'Case 1',
        data: { temp: 0.5 },
      },
      {
        testCaseName: 'Case 2',
        data: { model: 'gpt-4', tokens: 100 },
      },
    ];

    vi.mocked(actions.getTestCases).mockResolvedValue({
      ...createPageData(testCasesWithDifferentFacts),
    });

    render(<TestCasesList selectedTestSuite={mockTestSuite} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(actions.getTestCases).toHaveBeenCalled();
    });
  });

  test('does not refetch if test cases already exist and id remains same', async () => {
    vi.mocked(actions.getTestCases).mockResolvedValue(createPageData(mockTestCases));

    render(<TestCasesList selectedTestSuite={mockTestSuite} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(actions.getTestCases).toHaveBeenCalledTimes(1);
    });

    // Even if we wait longer, it shouldn't call again
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(actions.getTestCases).toHaveBeenCalledTimes(1);
  });
});

describe('TestCasesList — dirty-state tracking', () => {
  const mockTestSuite: TestSuite = { id: 'suite-1', name: 'Suite' };
  const mockOnChange = vi.fn();
  const mockOnDirtyChange = vi.fn();

  const makeColumn = (colId: string) => ({ getColId: () => colId });
  const makeCellEvent = (colId: string, rowData: Record<string, unknown>, newValue: unknown) => ({
    column: makeColumn(colId),
    data: rowData,
    newValue,
    node: {},
  });

  beforeEach(() => {
    vi.clearAllMocks();
    capturedGridOptions = null;
    capturedOnCellChange = null;
    vi.mocked(actions.getTestCases).mockResolvedValue({
      page: 0,
      size: 1000,
      totalElements: 0,
      totalPages: 0,
      content: [],
    });
  });

  const renderWithRef = () => {
    const actionsRef = createRef<TestCasesActions | null>();
    render(
      <TestCasesList
        selectedTestSuite={mockTestSuite}
        onChange={mockOnChange}
        testCasesActionsRef={actionsRef}
        onDirtyChange={mockOnDirtyChange}
      />,
    );
    return actionsRef;
  };

  test('4.2 — enabled change on existing row updates dirtyEnabledRef, not dirtyRowsRef', async () => {
    const actionsRef = renderWithRef();

    await waitFor(() => expect(capturedGridOptions).not.toBeNull());

    const row = { id: 'row-1', enabled: false, testCaseName: 'tc', createdAt: 0 };
    capturedGridOptions.onCellValueChanged(makeCellEvent('enabled', row, false));

    const enabledChanges = actionsRef.current?.getEnabledOnlyChanges();
    const dirtyTestCases = actionsRef.current?.getDirtyTestCases();

    expect(enabledChanges?.get('row-1')).toBe(false);
    // row-1 has no non-enabled changes, so it appears in enabledOnlyChanges but NOT in getDirtyTestCases
    expect(dirtyTestCases?.some((tc) => tc.id === 'row-1')).toBe(false);
  });

  test('4.1 — getEnabledOnlyChanges excludes rows also in dirtyRowsRef', async () => {
    const actionsRef = renderWithRef();

    await waitFor(() => expect(capturedGridOptions).not.toBeNull() && expect(capturedOnCellChange).not.toBeNull());

    // First make a field change on row-1 (adds to dirtyRowsRef via onCellChange)
    const row1 = { id: 'row-1', enabled: true, testCaseName: 'old', createdAt: 0 };
    capturedOnCellChange!({ ...row1, testCaseName: 'new' }, 'testCaseName', 'new');

    // Then toggle enabled on row-1 (already in dirtyRowsRef) and row-2 (not in dirtyRowsRef)
    capturedGridOptions.onCellValueChanged(makeCellEvent('enabled', { ...row1, testCaseName: 'new' }, false));
    const row2 = { id: 'row-2', enabled: true, testCaseName: 'tc2', createdAt: 0 };
    capturedGridOptions.onCellValueChanged(makeCellEvent('enabled', row2, false));

    const enabledOnlyChanges = actionsRef.current?.getEnabledOnlyChanges();
    // row-1 is in dirtyRowsRef (field change) → excluded from enabledOnlyChanges
    expect(enabledOnlyChanges?.has('row-1')).toBe(false);
    // row-2 is enabled-only → included
    expect(enabledOnlyChanges?.get('row-2')).toBe(false);
  });

  test('4.3 — field change after enabled change merges enabled into dirtyRowsRef entry', async () => {
    const actionsRef = renderWithRef();

    await waitFor(() => expect(capturedGridOptions).not.toBeNull() && expect(capturedOnCellChange).not.toBeNull());

    const row = { id: 'row-1', enabled: true, testCaseName: 'old', createdAt: 0 };

    // Toggle enabled first → goes to dirtyEnabledRef
    capturedGridOptions.onCellValueChanged(makeCellEvent('enabled', row, false));

    // Then change testCaseName via onCellChange (field editor path) → goes to dirtyRowsRef
    const updatedRow = { ...row, testCaseName: 'new', enabled: false };
    capturedOnCellChange!(updatedRow, 'testCaseName', 'new');

    const dirtyTestCases = actionsRef.current?.getDirtyTestCases();
    const savedRow = dirtyTestCases?.find((tc) => tc.id === 'row-1');

    // dirtyRowsRef entry should carry the enabled=false from dirtyEnabledRef
    expect(savedRow?.testCaseName).toBe('new');
    expect(savedRow?.enabled).toBe(false);

    // Row is now in dirtyRowsRef → excluded from enabledOnlyChanges
    const enabledOnly = actionsRef.current?.getEnabledOnlyChanges();
    expect(enabledOnly?.has('row-1')).toBe(false);
  });

  test('4.4 — clearDirtyAndRefresh clears both dirtyRowsRef and dirtyEnabledRef', async () => {
    const actionsRef = renderWithRef();

    await waitFor(() => expect(capturedGridOptions).not.toBeNull());

    await waitFor(() => expect(capturedOnCellChange).not.toBeNull());

    const row1 = { id: 'row-1', enabled: true, testCaseName: 'tc', createdAt: 0 };
    const row2 = { id: 'row-2', enabled: true, testCaseName: 'tc2', createdAt: 0 };

    capturedOnCellChange!({ ...row1, testCaseName: 'new' }, 'testCaseName', 'new');
    capturedGridOptions.onCellValueChanged(makeCellEvent('enabled', row2, false));

    expect(actionsRef.current?.getDirtyTestCases().length).toBeGreaterThan(0);
    expect(actionsRef.current?.getEnabledOnlyChanges().size).toBeGreaterThan(0);

    actionsRef.current?.clearDirtyAndRefresh();

    expect(actionsRef.current?.getDirtyTestCases().length).toBe(0);
    expect(actionsRef.current?.getEnabledOnlyChanges().size).toBe(0);
  });
});
