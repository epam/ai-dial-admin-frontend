import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FC, useCallback, useState } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { ButtonsI18nKey } from '@/src/constants/i18n';
import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import { FOCUS_RESTORE_WINDOW_MS } from '@/src/components/Runs/constants';
import { ExtractionResultTabUiState } from '../models';
import ExtractionResultTab from '../ExtractionResult';
import { createDefaultRunViewTabState } from '../use-run-view-tab-state';
import { ExtractionResultStatus } from '@/src/models/evaluation/run';

const mockShowSidebar = vi.fn();
const mockCloseSidebar = vi.fn();

interface ColumnDefLike {
  colId?: string;
  sortable?: boolean;
  children?: ColumnDefLike[];
  cellRendererParams?: {
    onToggleGroup: (groupKey: string) => void;
    consumeFocusRequest: (groupKey: string) => boolean;
  };
}

const focusRequests = vi.hoisted(() => [] as boolean[]);

const GROUP_ROW = { rowType: 'group', groupKey: 'Test Case 1', testCaseName: 'Test Case 1', isExpanded: true };

const gridApiMock = vi.hoisted(() => ({
  setFilterModel: vi.fn(),
  applyColumnState: vi.fn(),
  redrawRows: vi.fn(),
  getColumnState: vi.fn().mockReturnValue([]),
  setGridOption: vi.fn(),
  sizeColumnsToFit: vi.fn(),
}));

const getTestCaseRunResultsMock = vi.fn().mockResolvedValue({
  content: [
    {
      id: 'r1',
      responseStatusCode: 200,
      runIndex: 0,
      executionStatus: 'SUCCESS',
      testCaseName: 'Test Case 1',
    },
    {
      id: 'r2',
      responseStatusCode: 200,
      runIndex: 1,
      executionStatus: 'SUCCESS',
      testCaseName: 'Test Case 2',
    },
  ],
});

const executeStructuredQueryMock = vi.fn();

const SCORE_ROWS_RESULT = {
  rows: [
    { test_suite_run_id: 'run-1', test_case_name: 'Test Case 1', score: 0.7 },
    { test_suite_run_id: 'run-1', test_case_name: 'Test Case 2', score: 0 },
  ],
};

vi.mock('@/src/context/AppContext', () => ({
  useAppContext: () => ({
    sidebar: {
      show: false,
      content: null,
      showSidebar: mockShowSidebar,
      closeSidebar: mockCloseSidebar,
    },
    featureFlags: { deploymentsEnabled: true },
    isReadOnlyAdmin: false,
  }),
}));

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getTestCaseRunResults: (...args: unknown[]) => getTestCaseRunResultsMock(...args),
  executeStructuredQuery: (...args: unknown[]) => executeStructuredQueryMock(...args),
  getTestCaseRunResultDetails: vi.fn().mockResolvedValue({
    id: 'r1',
    responseStatusCode: 200,
    runIndex: 0,
    executionStatus: 'SUCCESS',
    execDurationMs: 1000,
    testCaseName: 'Test Case 1',
    testCaseData: {},
    metricValues: {},
  }),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    Spinner: ({ size }: { size: number }) => <div aria-label={`loading-${size}`} />,
  };
});

vi.mock('@/src/components/Grid/GridView/GridView', async () => {
  const { useEffect } = await import('react');
  const flattenLeaves = (cols: ColumnDefLike[]): ColumnDefLike[] =>
    cols.flatMap((col) => (col.children ? flattenLeaves(col.children) : [col]));

  return {
    default: ({
      additionalGridOptions,
      columnDefs,
      columnWidths,
      onColumnWidthsChange,
      onGridReady,
      rowData,
    }: {
      additionalGridOptions: Record<string, (e: unknown) => void>;
      columnDefs: ColumnDefLike[];
      columnWidths: Record<string, number>;
      onColumnWidthsChange: (widths: Record<string, number>) => void;
      onGridReady: (event: unknown) => void;
      rowData: { testCaseScore?: number | null; rowType?: string }[] | null;
    }) => {
      useEffect(() => {
        onGridReady({ api: gridApiMock });
      }, [onGridReady]);

      const nameColumn = flattenLeaves(columnDefs).find((col) => col.colId === 'testCaseName');
      const toggleColumn = flattenLeaves(columnDefs).find((col) => col.colId === 'groupToggle');

      return (
        <div
          role="grid"
          aria-label="Analytics grid"
          data-column-widths={JSON.stringify(columnWidths)}
          data-row-scores={JSON.stringify((rowData ?? []).map((row) => row.testCaseScore))}
          data-row-types={JSON.stringify((rowData ?? []).map((row) => row.rowType ?? 'plain'))}
          data-is-name-sortable={String(nameColumn?.sortable !== false)}
          data-has-toggle-column={String(toggleColumn != null)}
        >
          <button onClick={() => onColumnWidthsChange({ testCaseName: 240 })}>Resize column</button>
          <button onClick={() => additionalGridOptions.onRowClicked({ data: { id: 'r1' } })}>Row 1</button>
          <button onClick={() => additionalGridOptions.onRowClicked({ data: { id: 'r2' } })}>Row 2</button>
          <button onClick={() => additionalGridOptions.onRowClicked({ data: GROUP_ROW })}>Group row</button>
          <button
            onClick={() =>
              additionalGridOptions.onCellClicked({
                data: { id: 'r1' },
                column: { getColId: () => 'http' },
                colDef: { colId: 'http' },
              })
            }
          >
            Cell HTTP
          </button>
          <button
            onClick={() =>
              additionalGridOptions.onCellClicked({
                data: GROUP_ROW,
                column: { getColId: () => 'testCaseName' },
                colDef: { colId: 'testCaseName' },
              })
            }
          >
            Group cell
          </button>
          <button onClick={() => toggleColumn?.cellRendererParams?.onToggleGroup('Test Case 1')}>
            Toggle Test Case 1
          </button>
          <button
            onClick={() =>
              focusRequests.push(toggleColumn?.cellRendererParams?.consumeFocusRequest('Test Case 1') ?? false)
            }
          >
            Read focus request
          </button>
          <button onClick={() => additionalGridOptions.onNewColumnsLoaded({ api: gridApiMock })}>
            New columns loaded
          </button>
        </div>
      );
    },
  };
});

vi.mock('@/src/components/Grid/TreeColumnsPanel/TreeColumnsPanel', () => ({
  default: ({ toggleColumnsPanel }: { toggleColumnsPanel: () => void }) => (
    <div role="dialog" aria-label="Columns panel">
      <button onClick={toggleColumnsPanel}>Close panel</button>
    </div>
  ),
}));

vi.mock('@/src/components/Runs/View/RowDetails/ExecutionRowDetailPanel', () => ({
  default: () => <div data-testid="execution-row-detail-bottom-panel" />,
}));

const mockRun = {
  id: 'run-1',
  name: 'Test Run',
  testSuiteRunId: 'tsr-1',
} as never;

const ControlledExtractionResultTab: FC<{ initialState?: Partial<ExtractionResultTabUiState> }> = ({
  initialState,
}) => {
  const [extractionResultState, setState] = useState<ExtractionResultTabUiState>(() => ({
    ...createDefaultRunViewTabState().extractionResult,
    ...initialState,
  }));

  const setExtractionResultState = useCallback((patch: Partial<ExtractionResultTabUiState>) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <>
      <button
        onClick={() => setExtractionResultState({ isGroupedByTestCase: !extractionResultState.isGroupedByTestCase })}
      >
        Toggle grouping
      </button>
      <ExtractionResultTab
        run={mockRun}
        extractionResultState={extractionResultState}
        setExtractionResultState={setExtractionResultState}
      />
    </>
  );
};

const UNIFORM_RESULTS = [
  { id: 'r1', responseStatusCode: 200, runIndex: 0, testCaseName: 'Test Case 1' },
  { id: 'r2', responseStatusCode: 200, runIndex: 0, testCaseName: 'Test Case 2' },
];

const getGrid = () => screen.getByRole('grid', { name: 'Analytics grid' });

describe('ExtractionResultTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeStructuredQueryMock.mockResolvedValue(SCORE_ROWS_RESULT);
  });

  test('renders grid after loading without Columns button in tab body', async () => {
    render(<ControlledExtractionResultTab />);
    expect(await screen.findByRole('grid', { name: 'Analytics grid' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ButtonsI18nKey.Columns })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Columns panel' })).not.toBeInTheDocument();
  });

  test('keeps the column widths the grid reports in the tab state', async () => {
    render(<ControlledExtractionResultTab initialState={{ columnWidths: { status: 90 } }} />);
    const grid = await screen.findByRole('grid', { name: 'Analytics grid' });
    expect(grid).toHaveAttribute('data-column-widths', JSON.stringify({ status: 90 }));

    await userEvent.click(screen.getByRole('button', { name: 'Resize column' }));

    expect(screen.getByRole('grid', { name: 'Analytics grid' })).toHaveAttribute(
      'data-column-widths',
      JSON.stringify({ testCaseName: 240 }),
    );
  });

  test('shows Columns panel when showTreePanel is true', async () => {
    render(<ControlledExtractionResultTab initialState={{ showTreePanel: true }} />);
    expect(await screen.findByRole('dialog', { name: 'Columns panel' })).toBeInTheDocument();
  });

  test('does not refetch results when cached state is provided', async () => {
    render(
      <ControlledExtractionResultTab
        initialState={{
          results: [
            {
              id: 'r1',
              responseStatusCode: 200,
              runIndex: 0,
              executionStatus: ExtractionResultStatus.SUCCESS,
              testCaseName: 'Test Case 1',
            },
          ],
        }}
      />,
    );

    expect(await screen.findByRole('grid', { name: 'Analytics grid' })).toBeInTheDocument();

    expect(getTestCaseRunResultsMock).not.toHaveBeenCalled();
  });

  test('requests the scores of the run with one structured query', async () => {
    render(<ControlledExtractionResultTab />);

    await screen.findByRole('grid', { name: 'Analytics grid' });

    expect(executeStructuredQueryMock).toHaveBeenCalledOnce();
    expect(executeStructuredQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        entity: 'test_case_eval_scores',
        filter: expect.objectContaining({
          args: [expect.anything(), expect.objectContaining({ items: [expect.objectContaining({ value: 'run-1' })] })],
        }),
      }),
    );
  });

  test('hands the grid rows that carry their test case score', async () => {
    render(<ControlledExtractionResultTab initialState={{ isGroupedByTestCase: false }} />);

    expect(await screen.findByRole('grid', { name: 'Analytics grid' })).toHaveAttribute(
      'data-row-scores',
      JSON.stringify([0.7, 0]),
    );
  });

  test('keeps the spinner until the scores have loaded', async () => {
    executeStructuredQueryMock.mockReturnValue(new Promise(() => {}));
    render(<ControlledExtractionResultTab />);

    expect(await screen.findByLabelText('loading-40')).toBeInTheDocument();
    await vi.waitFor(() => expect(getTestCaseRunResultsMock).toHaveBeenCalledOnce());
    expect(screen.queryByRole('grid', { name: 'Analytics grid' })).not.toBeInTheDocument();
  });

  test.each([
    ['rejects', () => executeStructuredQueryMock.mockRejectedValue(new Error('boom'))],
    ['returns nothing', () => executeStructuredQueryMock.mockResolvedValue(null)],
  ])('still renders the grid, with no scores, when the scores request %s', async (_name, arrange) => {
    arrange();
    render(<ControlledExtractionResultTab initialState={{ isGroupedByTestCase: false }} />);

    expect(await screen.findByRole('grid', { name: 'Analytics grid' })).toHaveAttribute(
      'data-row-scores',
      JSON.stringify([null, null]),
    );
  });

  test('does not refetch scores when cached state is provided', async () => {
    render(<ControlledExtractionResultTab initialState={{ testCaseScores: [] }} />);

    await screen.findByRole('grid', { name: 'Analytics grid' });

    expect(executeStructuredQueryMock).not.toHaveBeenCalled();
  });

  test('opens bottom panel on row click by default', async () => {
    render(<ControlledExtractionResultTab />);

    await userEvent.click(await screen.findByRole('button', { name: 'Row 1' }));

    expect(mockShowSidebar).toHaveBeenCalledWith(expect.anything(), expect.any(String), SidebarPosition.Bottom);
  });

  test('opens bottom panel with focus field on cell click', async () => {
    render(<ControlledExtractionResultTab />);

    await userEvent.click(await screen.findByRole('button', { name: 'Cell HTTP' }));

    expect(mockShowSidebar).toHaveBeenCalledWith(expect.anything(), expect.any(String), SidebarPosition.Bottom);
  });

  test('calls closeSidebar on unmount', async () => {
    const { unmount } = render(<ControlledExtractionResultTab />);
    mockCloseSidebar.mockClear();

    unmount();

    expect(mockCloseSidebar).toHaveBeenCalled();
  });
});

describe('ExtractionResultTab — grouping by test case', () => {
  // Grouping is off until the user turns it on, so these start with the switch on.
  const renderGrouped = (initialState?: Partial<ExtractionResultTabUiState>) =>
    render(<ControlledExtractionResultTab initialState={{ isGroupedByTestCase: true, ...initialState }} />);

  beforeEach(() => {
    vi.clearAllMocks();
    executeStructuredQueryMock.mockResolvedValue(SCORE_ROWS_RESULT);
  });

  test('groups the rows by test case when run, request or turn varies', async () => {
    renderGrouped();

    await screen.findByRole('grid', { name: 'Analytics grid' });

    expect(getGrid()).toHaveAttribute('data-row-types', JSON.stringify(['group', 'result', 'group', 'result']));
  });

  test('puts the test case score on its group row', async () => {
    renderGrouped();

    await screen.findByRole('grid', { name: 'Analytics grid' });

    expect(getGrid()).toHaveAttribute('data-row-scores', JSON.stringify([0.7, 0.7, 0, 0]));
  });

  test('shows the flat list when grouping is switched off', async () => {
    renderGrouped({ isGroupedByTestCase: false });

    await screen.findByRole('grid', { name: 'Analytics grid' });

    expect(getGrid()).toHaveAttribute('data-row-types', JSON.stringify(['plain', 'plain']));
  });

  test('opens the flat list by default, even for a run whose results vary', async () => {
    render(<ControlledExtractionResultTab />);

    await screen.findByRole('grid', { name: 'Analytics grid' });

    expect(getGrid()).toHaveAttribute('data-row-types', JSON.stringify(['plain', 'plain']));
  });

  test('groups the rows once the user switches grouping on', async () => {
    render(<ControlledExtractionResultTab />);
    await screen.findByRole('grid', { name: 'Analytics grid' });

    await userEvent.click(screen.getByRole('button', { name: 'Toggle grouping' }));

    expect(getGrid()).toHaveAttribute('data-row-types', JSON.stringify(['group', 'result', 'group', 'result']));
  });

  test('keeps the flat list for a run whose results do not vary, even with grouping on', async () => {
    renderGrouped({ results: UNIFORM_RESULTS, testCaseScores: [], isGroupedByTestCase: true });

    await screen.findByRole('grid', { name: 'Analytics grid' });

    expect(getGrid()).toHaveAttribute('data-row-types', JSON.stringify(['plain', 'plain']));
  });

  test('hides the results of a group that is collapsed in the tab state', async () => {
    renderGrouped({ collapsedGroupKeys: ['Test Case 1'] });

    await screen.findByRole('grid', { name: 'Analytics grid' });

    expect(getGrid()).toHaveAttribute('data-row-types', JSON.stringify(['group', 'group', 'result']));
  });

  test('collapses and expands a group through the toggle the name column carries', async () => {
    const user = userEvent.setup();
    renderGrouped();
    await user.click(await screen.findByRole('button', { name: 'Toggle Test Case 1' }));

    expect(getGrid()).toHaveAttribute('data-row-types', JSON.stringify(['group', 'group', 'result']));

    await user.click(screen.getByRole('button', { name: 'Toggle Test Case 1' }));

    expect(getGrid()).toHaveAttribute('data-row-types', JSON.stringify(['group', 'result', 'group', 'result']));
  });

  test('makes columns unsortable only while grouped', async () => {
    const user = userEvent.setup();
    renderGrouped();
    await screen.findByRole('grid', { name: 'Analytics grid' });

    expect(getGrid()).toHaveAttribute('data-is-name-sortable', 'false');

    await user.click(screen.getByRole('button', { name: 'Toggle grouping' }));

    expect(getGrid()).toHaveAttribute('data-is-name-sortable', 'true');
  });

  test('adds the fixed toggle column only while grouped', async () => {
    const user = userEvent.setup();
    renderGrouped();
    await screen.findByRole('grid', { name: 'Analytics grid' });

    expect(getGrid()).toHaveAttribute('data-has-toggle-column', 'true');

    await user.click(screen.getByRole('button', { name: 'Toggle grouping' }));

    expect(getGrid()).toHaveAttribute('data-has-toggle-column', 'false');
  });

  test('does not open row details when a group row is clicked', async () => {
    renderGrouped();

    await userEvent.click(await screen.findByRole('button', { name: 'Group row' }));

    expect(mockShowSidebar).not.toHaveBeenCalled();
  });

  test('does not open row details when a group row cell is clicked', async () => {
    renderGrouped();

    await userEvent.click(await screen.findByRole('button', { name: 'Group cell' }));

    expect(mockShowSidebar).not.toHaveBeenCalled();
  });

  test('still opens row details for the next result click after a group cell click', async () => {
    const user = userEvent.setup();
    renderGrouped();
    await user.click(await screen.findByRole('button', { name: 'Group cell' }));

    await user.click(screen.getByRole('button', { name: 'Row 1' }));

    expect(mockShowSidebar).toHaveBeenCalledOnce();
  });

  test('leaves the sort and filter alone while the grid first opens', async () => {
    renderGrouped({ results: UNIFORM_RESULTS, testCaseScores: [], isGroupedByTestCase: true });

    await screen.findByRole('grid', { name: 'Analytics grid' });

    expect(gridApiMock.setFilterModel).not.toHaveBeenCalled();
    expect(gridApiMock.applyColumnState).not.toHaveBeenCalled();
  });

  test('clears the sort and filter when grouping is switched on or off', async () => {
    const user = userEvent.setup();
    renderGrouped();
    await screen.findByRole('grid', { name: 'Analytics grid' });
    gridApiMock.setFilterModel.mockClear();
    gridApiMock.applyColumnState.mockClear();

    await user.click(screen.getByRole('button', { name: 'Toggle grouping' }));

    expect(gridApiMock.setFilterModel).toHaveBeenCalledWith(null);
    expect(gridApiMock.applyColumnState).toHaveBeenCalledWith({ defaultState: { sort: null } });

    await user.click(screen.getByRole('button', { name: 'Toggle grouping' }));

    expect(gridApiMock.setFilterModel).toHaveBeenCalledTimes(2);
    expect(gridApiMock.applyColumnState).toHaveBeenCalledTimes(2);
  });

  test('redraws the rows once the grid has taken new columns, so group rows drop the flat list dashes', async () => {
    renderGrouped();
    await screen.findByRole('grid', { name: 'Analytics grid' });
    gridApiMock.redrawRows.mockClear();

    await userEvent.click(screen.getByRole('button', { name: 'New columns loaded' }));

    expect(gridApiMock.redrawRows).toHaveBeenCalledOnce();
  });

  describe('keyboard focus after a toggle', () => {
    const VARYING_RESULTS = [
      { id: 'r1', responseStatusCode: 200, runIndex: 0, testCaseName: 'Test Case 1' },
      { id: 'r2', responseStatusCode: 200, runIndex: 1, testCaseName: 'Test Case 1' },
    ];

    beforeEach(() => {
      focusRequests.length = 0;
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    test('lets the rebuilt toggle button of the toggled group take focus back, once', async () => {
      const user = userEvent.setup({ delay: null });
      renderGrouped({ results: VARYING_RESULTS, testCaseScores: [] });

      await user.click(screen.getByRole('button', { name: 'Toggle Test Case 1' }));
      await user.click(screen.getByRole('button', { name: 'Read focus request' }));
      await user.click(screen.getByRole('button', { name: 'Read focus request' }));

      expect(focusRequests).toEqual([true, false]);
    });

    test('grants no focus request when no group was toggled', async () => {
      renderGrouped({ results: VARYING_RESULTS, testCaseScores: [] });

      await userEvent.click(screen.getByRole('button', { name: 'Read focus request' }));

      expect(focusRequests).toEqual([false]);
    });

    // RTL's async wrapper waits on a real `setTimeout`, so `userEvent` would hang under fake timers;
    // `fireEvent` is the synchronous click for these two.
    test('keeps the request until the window has passed, since the grid mounts the rebuilt row later', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      renderGrouped({ results: VARYING_RESULTS, testCaseScores: [] });
      fireEvent.click(screen.getByRole('button', { name: 'Toggle Test Case 1' }));

      await vi.advanceTimersByTimeAsync(FOCUS_RESTORE_WINDOW_MS - 1);
      fireEvent.click(screen.getByRole('button', { name: 'Read focus request' }));

      expect(focusRequests).toEqual([true]);
    });

    test('drops a request that no rebuilt row picked up once the window has passed', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      renderGrouped({ results: VARYING_RESULTS, testCaseScores: [] });
      fireEvent.click(screen.getByRole('button', { name: 'Toggle Test Case 1' }));

      await vi.advanceTimersByTimeAsync(FOCUS_RESTORE_WINDOW_MS);
      fireEvent.click(screen.getByRole('button', { name: 'Read focus request' }));

      expect(focusRequests).toEqual([false]);
    });
  });
});
