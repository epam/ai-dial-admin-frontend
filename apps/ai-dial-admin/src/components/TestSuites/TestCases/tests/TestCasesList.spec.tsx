import { render, screen, waitFor } from '@testing-library/react';
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

vi.mock('@/src/components/TestSuites/utils/columns', () => ({
  getTestCaseColumns: (_suite: unknown, onCellChange: any) => {
    capturedOnCellChange = onCellChange;
    return [];
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
  const makeCellEvent = (colId: string, rowData: Record<string, unknown>, newValue: unknown, api?: any) => ({
    column: makeColumn(colId),
    data: rowData,
    newValue,
    node: {},
    api: api ?? { refreshClientSideRowModel: vi.fn() },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    capturedGridOptions = null;
    capturedOnCellChange = null;
    capturedRowData = null;
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
    const actionsRef = renderList(suite);

    await waitFor(() => expect(capturedOnCellChange).not.toBeNull());

    const row = { id: 'row-1', testCaseName: 'tc', createdAt: 0 };
    capturedOnCellChange!({ ...row, testCaseName: 'changed' }, 'testCaseName', 'changed');

    expect(actionsRef.current?.getDirtyTestCases().length).toBeGreaterThan(0);

    actionsRef.current?.clearDirtyAndRefresh();

    expect(actionsRef.current?.getDirtyTestCases().length).toBe(0);
    expect(mockOnDirtyChange).toHaveBeenLastCalledWith(false);
  });
});
