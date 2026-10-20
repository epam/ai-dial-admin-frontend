import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import CompareView from '../CompareView';
import Sidebar from '@/src/components/Common/Sidebar/Sidebar';
import { SidebarPosition } from '@/src/components/Common/Sidebar/models';
import { AppContextProvider } from '@/src/context/AppContext';
import { FeatureFlags } from '@/src/models/feature-flags';

const getRunMock = vi.fn();
const getRunsQueryMock = vi.fn();
const getTestCaseRunResultsMock = vi.fn();
const getTestCaseRunResultDetailsMock = vi.fn();
const executeStructuredQueryMock = vi.fn();
const getMetricSnapshotsMock = vi.fn();
const getTestSuiteMock = vi.fn();
const getMetricLatestVersionMock = vi.fn();
const routerReplaceMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: routerReplaceMock }),
}));

vi.mock('@/src/context/AppContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/src/context/AppContext')>();
  return actual;
});

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  getRun: (...args: unknown[]) => getRunMock(...args),
  getRunsQuery: (...args: unknown[]) => getRunsQueryMock(...args),
  getTestCaseRunResults: (...args: unknown[]) => getTestCaseRunResultsMock(...args),
  getTestCaseRunResultDetails: (...args: unknown[]) => getTestCaseRunResultDetailsMock(...args),
  executeStructuredQuery: (...args: unknown[]) => executeStructuredQueryMock(...args),
  getMetricSnapshots: (...args: unknown[]) => getMetricSnapshotsMock(...args),
  getMetricScoresComparison: vi.fn().mockResolvedValue({ runs: [] }),
}));

vi.mock('@/src/app/[lang]/test-suites/actions', () => ({
  getTestSuite: (...args: unknown[]) => getTestSuiteMock(...args),
  getMetricLatestVersion: (...args: unknown[]) => getMetricLatestVersionMock(...args),
}));

// The grid is not what this spec is about: the stub renders one button per row and fires the same
// onRowClicked callback the real grid would, so row-click -> detail panel wiring stays covered.
// ExecutionResultsTab.spec.tsx is the one genuine grid spec for this grid.
vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({
    rowData,
    additionalGridOptions,
  }: {
    rowData?: { id: string; testCaseName: string }[];
    additionalGridOptions?: { onRowClicked?: (event: { data: unknown }) => void };
  }) => (
    <section aria-label="Data grid">
      {rowData
        ?.filter((row) => row.id)
        .map((row) => (
          <button key={row.id} type="button" onClick={() => additionalGridOptions?.onRowClicked?.({ data: row })}>
            {row.testCaseName}
          </button>
        ))}
    </section>
  ),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    Spinner: ({ size }: { size: number }) => <div aria-label={`loading-${size}`} />,
    DialTag: ({
      label,
      icon,
      onClick,
      ...props
    }: {
      label: React.ReactNode;
      icon?: React.ReactNode;
      onClick?: () => void;
    }) => (
      <button type="button" disabled={!onClick} onClick={onClick} {...props}>
        {icon}
        {label}
      </button>
    ),
  };
});

const defaultFeatureFlags: FeatureFlags = {
  adminApiEnabled: false,
  catalogEnabled: true,
  dashboardEnabled: false,
  deploymentsEnabled: false,
  evaluationEnabled: true,
  mcpRegistryEnabled: false,
  hfEnabled: false,
  analyticsEnabled: false,
  analyticsSessionsEnabled: false,
  analyticsUsageEnabled: false,
  queryAssistantEnabled: false,
};

const renderCompareView = () =>
  render(
    <AppContextProvider featureFlags={defaultFeatureFlags}>
      <div className="w-[1400px] h-[800px] flex flex-col">
        <div className="flex flex-1 min-h-0">
          <CompareView runId="run-1" comparedRunId="run-sibling" />
          <Sidebar />
        </div>
        <Sidebar slot={SidebarPosition.Bottom} />
      </div>
    </AppContextProvider>,
  );

describe('CompareView', () => {
  beforeEach(() => {
    getRunMock.mockReset();
    getRunsQueryMock.mockReset();
    getTestCaseRunResultsMock.mockReset();
    getTestCaseRunResultDetailsMock.mockReset();
    executeStructuredQueryMock.mockReset();
    getMetricSnapshotsMock.mockReset();
    getTestSuiteMock.mockReset();
    getMetricLatestVersionMock.mockReset();
    routerReplaceMock.mockReset();
    executeStructuredQueryMock.mockResolvedValue({ rows: [] });
    getMetricSnapshotsMock.mockResolvedValue([]);
    getTestSuiteMock.mockResolvedValue({ response: { id: 'suite-1', name: 'General test-suite' } });
    getMetricLatestVersionMock.mockResolvedValue(null);
    getRunMock.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        testSuiteId: 'suite-1',
        testRunName: id === 'run-1' ? 'Run #316' : 'Run #317',
      }),
    );
    getRunsQueryMock.mockResolvedValue({
      content: [
        { id: 'run-1', testSuiteId: 'suite-1', status: 'COMPLETED' },
        { id: 'run-sibling', testSuiteId: 'suite-1', testRunName: 'Run #317', status: 'COMPLETED' },
      ],
    });
    getTestCaseRunResultsMock.mockImplementation((filters: { column: string; value: string }[]) => {
      const runId = filters.find((filter) => filter.column === 'runId')?.value;
      const isPrimary = runId === 'run-1';
      return Promise.resolve({
        content: [
          {
            id: isPrimary ? 'result-1' : 'result-2',
            testCaseId: 'tc-1',
            responseStatusCode: 200,
            runIndex: 0,
            executionStatus: 'SUCCESS',
            testCaseName: 'Test Case 1',
            metricValues: {
              Accuracy: { precision: isPrimary ? 0.5 : 0.8 },
            },
          },
        ],
      });
    });
    getTestCaseRunResultDetailsMock.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        testCaseId: 'tc-1',
        testCaseName: 'Test Case 1',
        runIndex: 0,
        executionStatus: 'SUCCESS',
        execDurationMs: 100,
        metricValues: {
          Accuracy: { precision: id === 'result-1' ? 0.5 : 0.8 },
        },
      }),
    );
  });

  test('renders title and both run tags', async () => {
    renderCompareView();

    expect(screen.getByText('Runs.RunComparison')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Runs.RunCompareFlip' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Runs.RunCompareAddRun' })).not.toBeInTheDocument();

    expect(await screen.findByRole('button', { name: 'Runs.RunComparePrimaryTagAria' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Runs.RunCompareTagAria' })).toBeInTheDocument();

    expect(getRunMock).toHaveBeenCalledWith('run-1');
  });

  test('flip makes the compared run the baseline and rewrites the url with the swapped ids', async () => {
    const user = userEvent.setup();
    renderCompareView();

    await screen.findByRole('button', { name: 'Runs.RunComparePrimaryTagAria' });

    await user.click(screen.getByRole('button', { name: 'Runs.RunCompareFlip' }));

    expect(routerReplaceMock).toHaveBeenCalledWith('/runs/compare?runs=run-sibling,run-1', { scroll: false });

    const primaryTag = await screen.findByRole('button', { name: 'Runs.RunComparePrimaryTagAria' });
    const comparedTag = screen.getByRole('button', { name: 'Runs.RunCompareTagAria' });
    expect(primaryTag.compareDocumentPosition(comparedTag) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await vi.waitFor(() => expect(getRunMock).toHaveBeenCalledWith('run-sibling'));
  });

  test('shows both run tags with ids before any run name has loaded', () => {
    getRunMock.mockImplementation(() => new Promise(() => {}));
    getRunsQueryMock.mockImplementation(() => new Promise(() => {}));
    renderCompareView();

    expect(screen.getByRole('button', { name: 'Runs.RunComparePrimaryTagAria' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Runs.RunCompareTagAria' })).toHaveTextContent('run-sibling');
  });

  test('keeps the known run names on flip while the new baseline is still loading', async () => {
    const user = userEvent.setup();
    renderCompareView();

    await screen.findByText('Run #317');
    getRunMock.mockImplementation(() => new Promise(() => {}));

    await user.click(screen.getByRole('button', { name: 'Runs.RunCompareFlip' }));

    expect(screen.getByRole('button', { name: 'Runs.RunCompareTagAria' })).toHaveTextContent('Run #316');
  });

  test('flipping twice restores the original order in the url', async () => {
    const user = userEvent.setup();
    renderCompareView();

    await screen.findByRole('button', { name: 'Runs.RunComparePrimaryTagAria' });

    await user.click(screen.getByRole('button', { name: 'Runs.RunCompareFlip' }));
    await user.click(screen.getByRole('button', { name: 'Runs.RunCompareFlip' }));

    expect(routerReplaceMock).toHaveBeenNthCalledWith(1, '/runs/compare?runs=run-sibling,run-1', { scroll: false });
    expect(routerReplaceMock).toHaveBeenNthCalledWith(2, '/runs/compare?runs=run-1,run-sibling', { scroll: false });
  });

  test('flip closes an open row detail panel', async () => {
    const user = userEvent.setup();
    renderCompareView();

    await user.click(screen.getByRole('tab', { name: 'Runs.RunCompareTabExecutionResults' }));
    await user.click(await screen.findByRole('button', { name: 'Test Case 1' }));
    expect(await screen.findByRole('heading', { level: 3, name: 'Test Case 1' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Runs.RunCompareFlip' }));

    // The grid reloads for the new baseline; once its rows are back the panel is known to be gone.
    expect(await screen.findByRole('button', { name: 'Test Case 1' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: 'Test Case 1' })).not.toBeInTheDocument();
  });

  test('opens modal from secondary run tag click and updates url on confirm', async () => {
    const user = userEvent.setup();
    getRunsQueryMock.mockResolvedValue({
      content: [
        { id: 'run-1', testSuiteId: 'suite-1', status: 'COMPLETED' },
        { id: 'run-sibling', testSuiteId: 'suite-1', testRunName: 'Run #317', status: 'COMPLETED' },
        { id: 'run-other', testSuiteId: 'suite-1', testRunName: 'Run #318', status: 'COMPLETED' },
      ],
    });

    renderCompareView();

    await waitFor(() => expect(screen.getByRole('button', { name: 'Runs.RunCompareTagAria' })).toBeEnabled());

    await user.click(screen.getByRole('button', { name: 'Runs.RunCompareTagAria' }));

    expect(await screen.findByText('Runs.RunCompareSelectRun')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Buttons.Confirm' }));

    expect(routerReplaceMock).toHaveBeenCalledWith('/runs/compare?runs=run-1,run-sibling', { scroll: false });
  });

  test('renders compare tabs with Summary Overview active by default', async () => {
    renderCompareView();

    expect(screen.getByRole('tab', { name: 'Runs.RunCompareTabSummaryOverview' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Runs.RunCompareTabHeatMap' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Runs.RunCompareTabExecutionResults' })).toBeInTheDocument();

    await screen.findByRole('button', { name: 'Runs.RunComparePrimaryTagAria' });

    expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();
    expect(screen.queryByText('Runs.RunCompareColorDisplay')).not.toBeInTheDocument();
    expect(document.querySelector('.ag-pinned-right-cols-container')).not.toBeInTheDocument();
  });

  test('shows heat map toolbar in the tabs row when Heat Map tab is active', async () => {
    const user = userEvent.setup();

    renderCompareView();

    await screen.findByRole('button', { name: 'Runs.RunComparePrimaryTagAria' });
    expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();

    const singleMetricTriggerLabel = 'Runs.RunCompareHeatMapMetricsPrefix Accuracy';

    expect(screen.queryByText(singleMetricTriggerLabel)).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Runs.RunCompareTabHeatMap' }));

    await waitFor(() => expect(screen.getByRole('button', { name: singleMetricTriggerLabel })).toBeEnabled());

    expect(screen.getByText(singleMetricTriggerLabel)).toBeInTheDocument();
    expect(screen.getByText('Runs.RunCompareColorDisplay')).toBeInTheDocument();
    expect(screen.getByText('Runs.RunCompareAbsoluteValues')).toBeInTheDocument();
  });

  test('switches tab content when clicking Execution Results and back to Summary Overview', async () => {
    const user = userEvent.setup();

    renderCompareView();

    await screen.findByRole('button', { name: 'Runs.RunComparePrimaryTagAria' });
    expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Runs.RunCompareTabExecutionResults' }));

    await screen.findByRole('region', { name: 'Data grid' });
    expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Runs.RunCompareTabSummaryOverview' }));

    expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  test('opens bottom pivot row detail by default when a row is clicked and closes on close button', async () => {
    const user = userEvent.setup();

    renderCompareView();

    await user.click(screen.getByRole('tab', { name: 'Runs.RunCompareTabExecutionResults' }));

    const row = await screen.findByRole('button', { name: 'Test Case 1' });

    expect(document.querySelector('[col-id="compare_action"]')).not.toBeInTheDocument();

    await user.click(row);

    expect(await screen.findByTitle('Runs.SwitchToSidebar')).toBeInTheDocument();
    expect(await screen.findByText('Run #316')).toBeInTheDocument();

    // Read after the panel has settled: the heading node is re-created while the row details load.
    const panelHeading = screen.getByRole('heading', { level: 3, name: 'Test Case 1' });

    const closeButton = within(panelHeading.parentElement as HTMLElement)
      .getAllByRole('button')
      .at(-1);
    await user.click(closeButton!);

    expect(screen.queryByRole('heading', { level: 3, name: 'Test Case 1' })).not.toBeInTheDocument();

    // Close preserves bottom mode: reopening shows pivot again (SwitchToSidebar), not sidebar.
    await user.click(row);

    expect(await screen.findByTitle('Runs.SwitchToSidebar')).toBeInTheDocument();
    expect(await screen.findByText('Run #316')).toBeInTheDocument();
  });

  test('switches row detail from bottom pivot to sidebar table and back', async () => {
    const user = userEvent.setup();

    renderCompareView();

    await user.click(screen.getByRole('tab', { name: 'Runs.RunCompareTabExecutionResults' }));

    const row = await screen.findByRole('button', { name: 'Test Case 1' });

    await user.click(row);

    expect(await screen.findByRole('heading', { level: 3, name: 'Test Case 1' })).toBeInTheDocument();
    const switchToSidebar = await screen.findByTitle('Runs.SwitchToSidebar');

    // Pivot is the default view in the bottom panel: the primary run-name row label is rendered.
    expect(await screen.findByText('Run #316')).toBeInTheDocument();

    await user.click(switchToSidebar);

    expect(await screen.findByTitle('Runs.SwitchToBottom')).toBeInTheDocument();
    expect(screen.queryByTitle('Runs.SwitchToSidebar')).not.toBeInTheDocument();
    expect(await screen.findByText('Runs.FieldColumn')).toBeInTheDocument();

    await user.click(screen.getByTitle('Runs.SwitchToBottom'));

    expect(await screen.findByTitle('Runs.SwitchToSidebar')).toBeInTheDocument();
    expect(await screen.findByText('Run #316')).toBeInTheDocument();
  });

  test('closes row detail panel when switching away from Execution Results tab', async () => {
    const user = userEvent.setup();

    renderCompareView();

    await user.click(screen.getByRole('tab', { name: 'Runs.RunCompareTabExecutionResults' }));

    const row = await screen.findByRole('button', { name: 'Test Case 1' });

    await user.click(row);

    expect(await screen.findByRole('heading', { level: 3, name: 'Test Case 1' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Runs.RunCompareTabSummaryOverview' }));

    expect(screen.queryByRole('heading', { level: 3, name: 'Test Case 1' })).not.toBeInTheDocument();
  });
});
