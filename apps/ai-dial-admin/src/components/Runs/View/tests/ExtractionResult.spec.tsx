import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ExtractionResultTab from '../ExtractionResult';

const mockShowSidebar = vi.fn();
const mockCloseSidebar = vi.fn();

const getRunsMock = vi.fn().mockResolvedValue({ content: [] });
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
  getTestCaseRunResults: (...args: unknown[]) => getTestCaseRunResultsMock(...args),
  getRuns: (...args: unknown[]) => getRunsMock(...args),
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
    DialSelect: ({ options, value, onChange, disabled, prefix }: any) => (
      <div>
        {prefix && <span>{prefix}</span>}
        <select
          aria-label="compare-with"
          value={value ?? ''}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          {(options || []).map((opt: any) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    ),
    DialGhostIconButton: ({ onClick }: any) => <button aria-label="clear-compare" onClick={onClick} />,
    DialLoader: ({ size }: any) => <div aria-label={`loading-${size}`} />,
  };
});

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

describe('ExtractionResultTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders grid after loading', async () => {
    render(<ExtractionResultTab run={mockRun} />);
    await waitFor(() => {
      expect(screen.getByRole('grid', { name: 'Analytics grid' })).toBeInTheDocument();
    });
  });

  test('opens sidebar on row click in default mode', async () => {
    render(<ExtractionResultTab run={mockRun} />);
    await waitFor(() => screen.getByRole('button', { name: 'Row 1' }));

    await userEvent.click(screen.getByRole('button', { name: 'Row 1' }));

    expect(mockShowSidebar).toHaveBeenCalledTimes(1);
  });

  test('toggles sidebar closed on same row click', async () => {
    render(<ExtractionResultTab run={mockRun} />);
    await waitFor(() => screen.getByRole('button', { name: 'Row 1' }));

    await userEvent.click(screen.getByRole('button', { name: 'Row 1' }));
    await userEvent.click(screen.getByRole('button', { name: 'Row 1' }));

    expect(mockCloseSidebar).toHaveBeenCalled();
  });

  test('calls closeSidebar on unmount', async () => {
    const { unmount } = render(<ExtractionResultTab run={mockRun} />);
    mockCloseSidebar.mockClear();

    unmount();

    expect(mockCloseSidebar).toHaveBeenCalled();
  });
});

describe('ExtractionResultTab :: compare dropdown', () => {
  const siblingRun = { id: 'run-sibling', testRunName: 'Sibling Run', startedAt: undefined };
  const mockRunWithSuite = { id: 'run-1', testSuiteId: 'suite-1' } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    getRunsMock.mockResolvedValue({ content: [siblingRun] });
    getTestCaseRunResultsMock.mockResolvedValue({ content: [] });
  });

  test('renders sibling runs as dropdown options', async () => {
    render(<ExtractionResultTab run={mockRunWithSuite} />);

    await waitFor(() => {
      const select = screen.getByLabelText('compare-with');
      expect(select.querySelector('option[value="run-sibling"]')).toBeInTheDocument();
    });
  });

  test('fetches compared results when a run is selected', async () => {
    render(<ExtractionResultTab run={mockRunWithSuite} />);

    await waitFor(() => {
      expect(screen.getByLabelText('compare-with').querySelector('option[value="run-sibling"]')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('compare-with'), { target: { value: 'run-sibling' } });
    });

    await waitFor(() => {
      expect(getTestCaseRunResultsMock).toHaveBeenCalledTimes(2);
    });
  });

  test('shows clear button when run is selected and removes it after clearing', async () => {
    render(<ExtractionResultTab run={mockRunWithSuite} />);

    await waitFor(() => {
      expect(screen.getByLabelText('compare-with').querySelector('option[value="run-sibling"]')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText('compare-with'), { target: { value: 'run-sibling' } });
    });

    await waitFor(() => {
      expect(screen.getByLabelText('clear-compare')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByLabelText('clear-compare'));

    await waitFor(() => {
      expect(screen.queryByLabelText('clear-compare')).not.toBeInTheDocument();
    });
  });
});
