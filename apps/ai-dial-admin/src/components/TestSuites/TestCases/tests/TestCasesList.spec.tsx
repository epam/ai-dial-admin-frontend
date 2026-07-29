import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import * as actions from '@/src/app/[lang]/datasets/actions';
import { TabsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { DatasetVisibility } from '@/src/models/evaluation/dataset';
import { ComparisonOp, ExprType, ValueType } from '@/src/models/evaluation/structured-query';
import { TestCase as TestCaseModel, TestSuite } from '@/src/models/evaluation/test-suite';

import TestCasesList, { TestCasesActions } from '../TestCasesList';
import { useIncludedIds } from '../RunCondition/use-included-ids';

type TestCase = Partial<TestCaseModel>;

const createPageData = (content: TestCase[]) => ({
  page: 0,
  size: 1000,
  totalElements: content.length,
  totalPages: 1,
  content: content as TestCaseModel[],
});

let capturedGridOptions: Record<string, unknown> | null = null;
let capturedOnCellChange: ((data: Record<string, unknown>, field: string, value: unknown) => void) | null = null;
let capturedRowData: Record<string, unknown>[] | null = null;
let capturedOnGridReady: ((event: { api: unknown }) => void) | null = null;
let capturedListLabel: unknown = null;
let capturedDatasetTag: unknown = null;

vi.mock('@/src/app/[lang]/datasets/actions', () => ({
  getTestCases: vi.fn(),
  createTestCase: vi.fn(),
  importTestCase: vi.fn(),
  removeTestCase: vi.fn(),
  removeMultipleTestCases: vi.fn(),
}));

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  executeStructuredQuery: vi.fn().mockResolvedValue({ rows: [] }),
}));

vi.mock('@/src/components/ListView/List', () => ({
  default: ({
    listLabel,
    listLabelAddon,
    emptyDataProps,
    onGridReady,
    additionalGridOptions,
    rowData,
    children,
  }: any) => {
    capturedGridOptions = additionalGridOptions;
    capturedRowData = rowData ?? null;
    capturedOnGridReady = onGridReady;
    capturedListLabel = listLabel;
    return (
      <div>
        <div>List View Component</div>
        <div>Title: {listLabel}</div>
        <div data-testid="list-label-addon">{listLabelAddon}</div>
        <div>Empty Title: {emptyDataProps?.title}</div>
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
  default: ({ selectedTestSuiteId, datasetTag }: any) => {
    capturedDatasetTag = datasetTag;
    return (
      <div>
        <div>Header Buttons</div>
        <div>Test Suite ID: {selectedTestSuiteId}</div>
        <div data-testid="dataset-tag">{datasetTag}</div>
      </div>
    );
  },
}));

vi.mock('@/src/components/TestSuites/TestCases/RunCondition/use-included-ids', () => ({
  useIncludedIds: vi.fn().mockReturnValue(null),
}));

vi.mock('@epam/ai-dial-ui-kit', async () => {
  const actual = await vi.importActual<any>('@epam/ai-dial-ui-kit');
  return {
    ...actual,
    DialSwitch: ({ label, isOn, onChange, switchId }: any) => (
      <label>
        <input type="checkbox" data-testid={switchId} checked={!!isOn} onChange={(e) => onChange?.(e.target.checked)} />
        {label}
      </label>
    ),
  };
});

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
    capturedListLabel = null;
    capturedDatasetTag = null;
    vi.mocked(useIncludedIds).mockReturnValue(null);
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

describe('TestCasesList — dirty tracking', () => {
  const mockOnChange = vi.fn();
  const mockOnDirtyChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    capturedGridOptions = null;
    capturedOnCellChange = null;
    capturedRowData = null;
    capturedOnGridReady = null;
    capturedListLabel = null;
    capturedDatasetTag = null;
    vi.mocked(useIncludedIds).mockReturnValue(null);
    vi.mocked(actions.getTestCases).mockResolvedValue({
      page: 0,
      size: 1000,
      totalElements: 0,
      totalPages: 0,
      content: [],
    });
  });

  test('clearDirtyAndRefresh clears dirty rows and calls onDirtyChange(false)', async () => {
    const suite: TestSuite = { id: 'suite-1', datasetId: 'ds-1' };
    const actionsRef = createRef<TestCasesActions | null>();
    render(
      <TestCasesList
        selectedTestSuite={suite}
        onChange={mockOnChange}
        testCasesActionsRef={actionsRef}
        onDirtyChange={mockOnDirtyChange}
      />,
    );

    await waitFor(() => expect(capturedOnCellChange).not.toBeNull());

    const row = { id: 'row-1', testCaseName: 'tc', createdAt: 0 };
    capturedOnCellChange!({ ...row, testCaseName: 'changed' }, 'testCaseName', 'changed');

    expect(actionsRef.current?.getDirtyTestCases().length).toBeGreaterThan(0);

    actionsRef.current?.clearDirtyAndRefresh();

    expect(actionsRef.current?.getDirtyTestCases().length).toBe(0);
    expect(mockOnDirtyChange).toHaveBeenLastCalledWith(false);
  });

  test('loads rows without enabled checkbox overlay', async () => {
    const suite: TestSuite = {
      id: 'suite-1',
      datasetId: 'ds-1',
      disabledTestCaseIds: ['row-1'],
    };

    vi.mocked(actions.getTestCases).mockResolvedValue(
      createPageData([
        { id: 'row-1', testCaseName: 'case 1', createdAt: 0 },
        { id: 'row-2', testCaseName: 'case 2', createdAt: 0 },
      ]),
    );

    render(<TestCasesList selectedTestSuite={suite} onChange={mockOnChange} onDirtyChange={mockOnDirtyChange} />);

    await waitFor(() => {
      expect(capturedRowData).not.toBeNull();
      expect(capturedRowData!.length).toBe(2);
    });

    expect(capturedRowData![0]).not.toHaveProperty('enabled');
    expect(capturedGridOptions?.onCellValueChanged).toBeUndefined();
  });
});

describe('TestCasesList — header and included-only filter', () => {
  const mockOnChange = vi.fn();
  const filterNode = {
    op: ComparisonOp.Co,
    args: [
      { type: ExprType.Field, name: 'test_case_name' },
      { type: ExprType.Value, value_type: ValueType.String, value: 'match' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    capturedGridOptions = null;
    capturedOnCellChange = null;
    capturedRowData = null;
    capturedOnGridReady = null;
    capturedListLabel = null;
    capturedDatasetTag = null;
    vi.mocked(useIncludedIds).mockReturnValue(null);
    vi.mocked(actions.getTestCases).mockResolvedValue(
      createPageData([
        { id: 'row-1', testCaseName: 'case 1', createdAt: 0 },
        { id: 'row-2', testCaseName: 'case 2', createdAt: 0 },
      ]),
    );
  });

  test('renders title without count or dataset tag', async () => {
    render(
      <TestCasesList
        selectedTestSuite={{ id: 'suite-1', datasetId: 'ds-1' }}
        onChange={mockOnChange}
        dataset={{
          id: 'ds-1',
          name: 'CaseCollection_Eta',
          visibility: DatasetVisibility.PUBLIC,
        }}
        isReadOnly
      />,
    );

    await waitFor(() => expect(capturedListLabel).toBe(TabsI18nKey.TestCases));
    expect(String(capturedListLabel)).not.toContain(':');
    expect(screen.getByTestId('dataset-tag').textContent).toContain('CaseCollection_Eta');
  });

  test('renders included-only switch addon', async () => {
    render(<TestCasesList selectedTestSuite={{ id: 'suite-1', datasetId: 'ds-1' }} onChange={mockOnChange} />);

    await waitFor(() => {
      expect(screen.getByTestId('view-only-included-in-run')).toBeInTheDocument();
    });
    expect(screen.getByText(TestSuitesI18nKey.ViewOnlyIncludedInRun)).toBeInTheDocument();
  });

  test('external filter hides non-included rows when switch is on', async () => {
    vi.mocked(useIncludedIds).mockReturnValue(new Set(['row-1']));

    const onFilterChanged = vi.fn();
    const applyColumnState = vi.fn();
    render(
      <TestCasesList
        selectedTestSuite={{ id: 'suite-1', datasetId: 'ds-1', testCaseFilter: filterNode }}
        onChange={mockOnChange}
      />,
    );

    await waitFor(() => expect(capturedGridOptions).not.toBeNull());
    capturedOnGridReady?.({
      api: { onFilterChanged, refreshCells: vi.fn(), applyColumnState, setGridOption: vi.fn() },
    });

    const isPresent = capturedGridOptions!.isExternalFilterPresent as () => boolean;
    const doesPass = capturedGridOptions!.doesExternalFilterPass as (node: {
      data?: Record<string, unknown>;
    }) => boolean;

    expect(isPresent()).toBe(false);
    expect(doesPass({ data: { id: 'row-2' } })).toBe(true);

    fireEvent.click(screen.getByTestId('view-only-included-in-run'));

    await waitFor(() => expect(isPresent()).toBe(true));
    expect(doesPass({ data: { id: 'row-1' } })).toBe(true);
    expect(doesPass({ data: { id: 'row-2' } })).toBe(false);
  });

  test('sorts included rows to the top when run condition filter is active', async () => {
    vi.mocked(useIncludedIds).mockReturnValue(new Set(['row-1']));

    const applyColumnState = vi.fn();
    const refreshCells = vi.fn();
    const onFilterChanged = vi.fn();

    render(
      <TestCasesList
        selectedTestSuite={{ id: 'suite-1', datasetId: 'ds-1', testCaseFilter: filterNode }}
        onChange={mockOnChange}
      />,
    );

    await waitFor(() => expect(capturedOnGridReady).not.toBeNull());

    capturedOnGridReady?.({
      api: { applyColumnState, refreshCells, onFilterChanged, setGridOption: vi.fn() },
    });

    expect(applyColumnState).toHaveBeenCalledWith({
      state: [{ colId: 'includedInRun', sort: 'desc', sortIndex: 0 }],
      defaultState: { sort: null },
    });
  });
});
