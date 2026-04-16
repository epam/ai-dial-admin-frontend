import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import AnalyticsTab from '../Analytics';

const mockShowSidebar = vi.fn();
const mockCloseSidebar = vi.fn();

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
  getMetricSnapshots: vi.fn().mockResolvedValue([]),
  getTestCaseRunResults: vi.fn().mockResolvedValue({
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
  }),
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

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ additionalGridOptions }: any) => (
    <div role="grid" aria-label="Analytics grid">
      <button onClick={() => additionalGridOptions.onRowClicked({ data: { id: 'r1' } })}>Row 1</button>
      <button onClick={() => additionalGridOptions.onRowClicked({ data: { id: 'r2' } })}>Row 2</button>
    </div>
  ),
}));

const mockRun = {
  id: 'run-1',
  name: 'Test Run',
  testSuiteRunId: 'tsr-1',
} as any;

describe('AnalyticsTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading', async () => {
    render(<AnalyticsTab run={mockRun} />);
    expect(screen.getByText('Tabs.Analytics')).toBeInTheDocument();
  });

  it('renders grid after loading', async () => {
    render(<AnalyticsTab run={mockRun} />);
    await waitFor(() => {
      expect(screen.getByRole('grid', { name: 'Analytics grid' })).toBeInTheDocument();
    });
  });

  it('opens sidebar on row click in default mode', async () => {
    render(<AnalyticsTab run={mockRun} />);
    await waitFor(() => screen.getByRole('button', { name: 'Row 1' }));

    await userEvent.click(screen.getByRole('button', { name: 'Row 1' }));

    expect(mockShowSidebar).toHaveBeenCalledTimes(1);
  });

  it('toggles sidebar closed on same row click', async () => {
    render(<AnalyticsTab run={mockRun} />);
    await waitFor(() => screen.getByRole('button', { name: 'Row 1' }));

    await userEvent.click(screen.getByRole('button', { name: 'Row 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Row 1' }));

    expect(mockCloseSidebar).toHaveBeenCalled();
  });

  it('calls closeSidebar on unmount', async () => {
    const { unmount } = render(<AnalyticsTab run={mockRun} />);
    mockCloseSidebar.mockClear();

    unmount();

    expect(mockCloseSidebar).toHaveBeenCalled();
  });
});
