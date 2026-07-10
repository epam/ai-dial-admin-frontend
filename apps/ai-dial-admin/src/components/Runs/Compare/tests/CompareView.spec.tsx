import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import CompareView from '../CompareView';
import Sidebar from '@/src/components/Common/Sidebar/Sidebar';
import { AppContextProvider } from '@/src/context/AppContext';
import { FeatureFlags } from '@/src/models/feature-flags';

const getRunMock = vi.fn();
const getRunsMock = vi.fn();
const getTestCaseRunResultsMock = vi.fn();
const getTestCaseRunResultDetailsMock = vi.fn();
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
  getRuns: (...args: unknown[]) => getRunsMock(...args),
  getTestCaseRunResults: (...args: unknown[]) => getTestCaseRunResultsMock(...args),
  getTestCaseRunResultDetails: (...args: unknown[]) => getTestCaseRunResultDetailsMock(...args),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    DialLoader: ({ size }: { size: number }) => <div aria-label={`loading-${size}`} />,
    DialTag: ({ label, onClick, ...props }: { label: React.ReactNode; onClick?: () => void }) => (
      <button type="button" disabled={!onClick} onClick={onClick} {...props}>
        {label}
      </button>
    ),
  };
});

const renderCompareView = (featureFlags: Partial<FeatureFlags> = { runsCompareEnabled: true }) =>
  render(
    <AppContextProvider featureFlags={featureFlags as FeatureFlags}>
      <div className="w-[1400px] h-[800px] flex flex-col">
        <CompareView runId="run-1" comparedRunId="run-sibling" />
      </div>
      <Sidebar />
    </AppContextProvider>,
  );

describe('CompareView', () => {
  beforeEach(() => {
    getRunMock.mockReset();
    getRunsMock.mockReset();
    getTestCaseRunResultsMock.mockReset();
    getTestCaseRunResultDetailsMock.mockReset();
    routerReplaceMock.mockReset();
    getRunMock.mockImplementation((id: string) =>
      Promise.resolve({
        id,
        testSuiteId: 'suite-1',
        testRunName: id === 'run-1' ? 'Run #316' : 'Run #317',
      }),
    );
    getRunsMock.mockResolvedValue({
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
    expect(screen.getByText('Runs.RunCompareVs')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Runs.RunCompareAddRun' })).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Runs.RunCompareTagAria' })).toHaveLength(2);
    });

    expect(getRunMock).toHaveBeenCalledWith('run-1');
  });

  test('opens modal from secondary run tag click and updates url on confirm', async () => {
    const user = userEvent.setup();
    getRunsMock.mockResolvedValue({
      content: [
        { id: 'run-1', testSuiteId: 'suite-1', status: 'COMPLETED' },
        { id: 'run-sibling', testSuiteId: 'suite-1', testRunName: 'Run #317', status: 'COMPLETED' },
        { id: 'run-other', testSuiteId: 'suite-1', testRunName: 'Run #318', status: 'COMPLETED' },
      ],
    });

    renderCompareView();

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: 'Runs.RunCompareTagAria' })[1]).toBeEnabled();
    });

    await user.click(screen.getAllByRole('button', { name: 'Runs.RunCompareTagAria' })[1]);

    await waitFor(() => {
      expect(screen.getByText('Runs.RunCompareSelectRun')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Buttons.Confirm' }));

    expect(routerReplaceMock).toHaveBeenCalledWith('/runs/compare?runs=run-1,run-sibling', { scroll: false });
  });

  test('renders compare tabs with Execution Results active by default', async () => {
    renderCompareView();

    expect(screen.getByRole('tab', { name: 'Runs.RunCompareTabSummaryOverview' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Runs.RunCompareTabHeatMap' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Runs.RunCompareTabExecutionResults' })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();
    });
  });

  test('disables summary and heat map tabs when runsCompareEnabled is false', () => {
    renderCompareView({ runsCompareEnabled: false });

    expect(screen.getByRole('tab', { name: 'Runs.RunCompareTabSummaryOverview' })).toBeDisabled();
    expect(screen.getByRole('tab', { name: 'Runs.RunCompareTabHeatMap' })).toBeDisabled();
    expect(screen.getByRole('tab', { name: 'Runs.RunCompareTabExecutionResults' })).toBeEnabled();
  });

  test('shows heat map toolbar in the tabs row when Heat Map tab is active', async () => {
    const user = userEvent.setup();

    renderCompareView();

    await waitFor(() => {
      expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();
    });

    expect(screen.queryByText('Runs.RunCompareHeatMapMetricsAll')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Runs.RunCompareTabHeatMap' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Runs.RunCompareHeatMapMetricsAll' })).toBeEnabled();
    });

    expect(screen.getByText('Runs.RunCompareHeatMapMetricsAll')).toBeInTheDocument();
    expect(screen.getByText('Runs.RunCompareColorDisplay')).toBeInTheDocument();
    expect(screen.getByText('Runs.RunCompareAbsoluteValues')).toBeInTheDocument();
  });

  test('switches tab content when clicking Summary Overview and back to Execution Results', async () => {
    const user = userEvent.setup();

    renderCompareView();

    await waitFor(() => {
      expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Runs.RunCompareTabSummaryOverview' }));

    expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Runs.RunCompareTabExecutionResults' }));

    await waitFor(() => {
      expect(screen.queryByLabelText('loading-40')).not.toBeInTheDocument();
    });
  });

  test('opens row detail panel when eye button is clicked and closes on close button', async () => {
    const user = userEvent.setup();

    renderCompareView();

    let eyeButton: HTMLButtonElement | null = null;
    await waitFor(() => {
      eyeButton = document.querySelector('.ag-pinned-right-cols-container [col-id="compare_action"] button');
      expect(eyeButton).toBeTruthy();
    });

    fireEvent.click(eyeButton!);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'Test Case 1' })).toBeInTheDocument();
      expect(screen.getByText('Runs.FieldColumn')).toBeInTheDocument();
    });

    const panelHeading = screen.getByRole('heading', { level: 3, name: 'Test Case 1' });
    const closeButton = within(panelHeading.parentElement as HTMLElement)
      .getAllByRole('button')
      .at(-1);
    await user.click(closeButton!);

    await waitFor(() => {
      expect(screen.queryByText('Runs.FieldColumn')).not.toBeInTheDocument();
    });
  });

  test('switches row detail to the bottom drawer (pivot default) and back to the sidebar', async () => {
    const user = userEvent.setup();

    renderCompareView();

    let eyeButton: HTMLButtonElement | null = null;
    await waitFor(() => {
      eyeButton = document.querySelector('.ag-pinned-right-cols-container [col-id="compare_action"] button');
      expect(eyeButton).toBeTruthy();
    });

    fireEvent.click(eyeButton!);

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 3, name: 'Test Case 1' })).toBeInTheDocument();
    });

    await user.click(screen.getByTitle('Runs.SwitchToDrawer'));

    await waitFor(() => {
      expect(screen.getByRole('complementary', { name: 'Runs.AnalysisDrawerLabel' })).toBeInTheDocument();
    });

    const drawer = screen.getByRole('complementary', { name: 'Runs.AnalysisDrawerLabel' });
    // Pivot is the default view in the drawer: the primary run-name row label is rendered.
    await waitFor(() => {
      expect(within(drawer).getByText('Run #316')).toBeInTheDocument();
    });

    await user.click(within(drawer).getByTitle('Runs.SwitchToSidebar'));

    await waitFor(() => {
      expect(screen.queryByRole('complementary', { name: 'Runs.AnalysisDrawerLabel' })).not.toBeInTheDocument();
    });

    expect(screen.getByTitle('Runs.SwitchToDrawer')).toBeInTheDocument();
  });

  test('closes row detail panel when switching away from Execution Results tab', async () => {
    const user = userEvent.setup();

    renderCompareView();

    let eyeButton: HTMLButtonElement | null = null;
    await waitFor(() => {
      eyeButton = document.querySelector('.ag-pinned-right-cols-container [col-id="compare_action"] button');
      expect(eyeButton).toBeTruthy();
    });

    fireEvent.click(eyeButton!);

    await waitFor(() => {
      expect(screen.getByText('Runs.FieldColumn')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: 'Runs.RunCompareTabSummaryOverview' }));

    expect(screen.queryByText('Runs.FieldColumn')).not.toBeInTheDocument();
  });
});
