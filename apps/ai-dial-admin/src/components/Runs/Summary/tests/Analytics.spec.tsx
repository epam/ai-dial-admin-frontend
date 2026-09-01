import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { StructuredQuery } from '@/src/models/evaluation/structured-query';
import Analytics from '../Analytics';

const executeStructuredQueryMock = vi.fn();
const getRunCostsMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  executeStructuredQuery: (query: StructuredQuery) => executeStructuredQueryMock(query),
  getRunCosts: (id: string) => getRunCostsMock(id),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    DialLoader: ({ size }: any) => <div aria-label={`loading-${size}`} />,
    DialAnalyticsCard: ({ title, value, description, error, isLoading }: any) => (
      <div role="region" aria-label={typeof title === 'string' ? title : undefined}>
        <div>{title}</div>
        {isLoading ? <span>cost-loading</span> : <div>{value}</div>}
        <div>{description}</div>
        {error && <span>error-tag</span>}
      </div>
    ),
  };
});

const STATUS_ROWS = {
  rows: [
    { execution_status: 'SUCCESS', count: 37 },
    { execution_status: 'FAILED', count: 3 },
    { execution_status: 'TIMEOUT', count: 1 },
    { execution_status: 'ERROR', count: 2 },
  ],
};
const AVG_ROWS = { rows: [{ avg_duration_ms: 199.6 }] };
const AVG_METRIC_EVAL_ROWS = { rows: [{ avg_metric_eval_duration_ms: 291123.6 }] };

const mockQueries = () => {
  executeStructuredQueryMock.mockImplementation((query: StructuredQuery) => {
    if (query.group_by) {
      return Promise.resolve(STATUS_ROWS);
    }
    const alias = query.select?.[0]?.as;
    if (alias === 'avg_duration_ms') {
      return Promise.resolve(AVG_ROWS);
    }
    if (alias === 'avg_metric_eval_duration_ms') {
      return Promise.resolve(AVG_METRIC_EVAL_ROWS);
    }
    return Promise.resolve({ rows: [] });
  });
};

const mockCosts = (payload: { avgTestCaseCost: number | null; avgMetricEvalCost: number | null } | null) => {
  getRunCostsMock.mockResolvedValue(payload);
};

describe('Runs Summary :: Analytics', () => {
  beforeEach(() => {
    executeStructuredQueryMock.mockReset();
    getRunCostsMock.mockReset();
  });

  test('shows a loader until data resolves', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0.01, avgMetricEvalCost: 0.02 });
    render(<Analytics run={{ id: 'run-1' } as any} />);

    expect(screen.getByLabelText('loading-32')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Runs.TestCasesPassed')).toBeInTheDocument());
  });

  test('renders read-only overall score card when overall data is present', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0, avgMetricEvalCost: 0 });
    render(<Analytics run={{ id: 'run-1' } as any} overallScore={0.812} />);

    expect(await screen.findByText('Runs.OverallScore')).toBeInTheDocument();
    expect(screen.getByText('0.812')).toBeInTheDocument();
    expect(screen.getByText('Runs.OverallScoreDescription')).toBeInTheDocument();
  });

  test('hides overall score card when overall data is absent', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0, avgMetricEvalCost: 0 });
    render(<Analytics run={{ id: 'run-1' } as any} overallScore={null} />);

    await screen.findByText('Runs.TestCasesPassed');
    expect(screen.queryByText('Runs.OverallScore')).not.toBeInTheDocument();
  });

  test('hides overall score card while overall score is still loading', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0, avgMetricEvalCost: 0 });
    render(<Analytics run={{ id: 'run-1' } as any} />);

    await screen.findByText('Runs.TestCasesPassed');
    expect(screen.queryByText('Runs.OverallScore')).not.toBeInTheDocument();
  });

  test('renders passed test cases card with N/M value and status breakdown', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0, avgMetricEvalCost: 0 });
    render(<Analytics run={{ id: 'run-1' } as any} />);

    await screen.findByText('37');
    await screen.findByText('/ 43');
    expect(screen.getByText('37 Runs.Pass')).toBeInTheDocument();
    expect(screen.getByText('4 Runs.Fail')).toBeInTheDocument();
    expect(screen.getByText('2 Runs.ExecError')).toBeInTheDocument();
  });

  test('renders average run time card in seconds', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0, avgMetricEvalCost: 0 });
    render(<Analytics run={{ id: 'run-1' } as any} />);

    expect(await screen.findByText('0.2 Runs.Seconds')).toBeInTheDocument();
  });

  test('renders average metric-eval latency card in seconds', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0, avgMetricEvalCost: 0 });
    render(<Analytics run={{ id: 'run-1' } as any} />);

    expect(await screen.findByText('Runs.AvgMetricEvalLatency')).toBeInTheDocument();
    expect(screen.getByText('291.1 Runs.Seconds')).toBeInTheDocument();
  });

  test('marks cards as error when the run has no data', async () => {
    executeStructuredQueryMock.mockResolvedValue({ rows: [] });
    mockCosts({ avgTestCaseCost: 0, avgMetricEvalCost: 0 });
    render(<Analytics run={{ id: 'run-1' } as any} overallScore={null} />);

    await waitFor(() => expect(screen.getAllByText('error-tag').length).toBeGreaterThanOrEqual(3));
  });

  test('renders cost cards with dollar values', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0.0123, avgMetricEvalCost: 1.5 });
    render(<Analytics run={{ id: 'run-1' } as any} />);

    expect(await screen.findByText('Runs.TestCaseLlmCost')).toBeInTheDocument();
    expect(screen.getByText('Runs.MetricEvalCost')).toBeInTheDocument();
    expect(screen.getByText('$0.012')).toBeInTheDocument();
    expect(screen.getByText('$1.5')).toBeInTheDocument();
    expect(screen.getAllByText('Runs.AvgPerTestCase').length).toBeGreaterThanOrEqual(2);
  });

  test('renders em dash when a cost field is null', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: null, avgMetricEvalCost: 0 });
    render(<Analytics run={{ id: 'run-1' } as any} />);

    expect(await screen.findByText('Runs.TestCaseLlmCost')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  test('shows Cost data unavailable without dropping other KPI cards', async () => {
    mockQueries();
    mockCosts(null);
    render(<Analytics run={{ id: 'run-1' } as any} />);

    expect(await screen.findByText('Runs.TestCasesPassed')).toBeInTheDocument();
    expect(screen.getByText('0.2 Runs.Seconds')).toBeInTheDocument();
    expect(screen.getByText('Runs.TestCaseLlmCost')).toBeInTheDocument();
    expect(screen.getByText('Runs.MetricEvalCost')).toBeInTheDocument();
    expect(screen.getAllByText('Runs.CostDataUnavailable')).toHaveLength(2);
    const costRegions = [
      screen.getByRole('region', { name: 'Runs.TestCaseLlmCost' }),
      screen.getByRole('region', { name: 'Runs.MetricEvalCost' }),
    ];
    for (const region of costRegions) {
      expect(region).toHaveTextContent('error-tag');
    }
  });

  test('shows loading on cost cards while costs resolve after analytics', async () => {
    mockQueries();
    let resolveCosts: (value: { avgTestCaseCost: number; avgMetricEvalCost: number }) => void = () => undefined;
    getRunCostsMock.mockReturnValue(
      new Promise((resolve) => {
        resolveCosts = resolve;
      }),
    );

    render(<Analytics run={{ id: 'run-1' } as any} />);

    expect(await screen.findByText('Runs.TestCasesPassed')).toBeInTheDocument();
    expect(screen.getAllByText('cost-loading')).toHaveLength(2);

    resolveCosts({ avgTestCaseCost: 0.5, avgMetricEvalCost: 0.25 });
    expect(await screen.findByText('$0.5')).toBeInTheDocument();
    expect(screen.getByText('$0.25')).toBeInTheDocument();
    expect(screen.queryByText('cost-loading')).not.toBeInTheDocument();
  });
});
