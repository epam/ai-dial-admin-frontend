import { render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { DeploymentType } from '@/src/models/evaluation/deployment';
import { RunStatus } from '@/src/models/evaluation/run';
import { StructuredQuery } from '@/src/models/evaluation/structured-query';
import { SuiteType } from '@/src/models/evaluation/test-suite';
import Analytics from '../Analytics';
import { COST_FETCH_POLL_INTERVAL_MS } from '../constants';

const executeStructuredQueryMock = vi.fn();
const getRunCostsMock = vi.fn();
const getPlatformModelMock = vi.fn();
const getEntityModelMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  executeStructuredQuery: (query: StructuredQuery) => executeStructuredQueryMock(query),
  getRunCosts: (id: string) => getRunCostsMock(id),
}));

vi.mock('@/src/app/[lang]/platform-models/actions', () => ({
  getModel: (...args: unknown[]) => getPlatformModelMock(...args),
}));

vi.mock('@/src/app/[lang]/models/actions', () => ({
  getModel: (...args: unknown[]) => getEntityModelMock(...args),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    DialLoader: ({ size }: any) => <div aria-label={`loading-${size}`} />,
    DialAnalyticsCard: ({ title, value, description, error, isLoading }: any) => (
      <div role="region" aria-label={typeof title === 'string' ? title : undefined}>
        <div>{title}</div>
        {error ? <span>error-tag</span> : isLoading ? <span>cost-loading</span> : <div>{value}</div>}
        {!error && !isLoading && <div>{description}</div>}
      </div>
    ),
  };
});

const STATUS_ROWS = {
  rows: [
    { execution_status: 'SUCCESS', passed: true, count: 37 },
    { execution_status: 'SUCCESS', passed: false, count: 3 },
    { execution_status: 'TIMEOUT', passed: null, count: 1 },
    { execution_status: 'ERROR', passed: null, count: 2 },
  ],
};
const AVG_ROWS = { rows: [{ avg_duration_ms: 199.6 }] };
const AVG_METRIC_EVAL_ROWS = { rows: [{ avg_metric_eval_duration_ms: 291123.6 }] };

const RUN_WITH_THRESHOLD = { id: 'run-1', suiteSnapshot: { overallScoreThreshold: 0.5 } };
const RUN_WITHOUT_THRESHOLD = { id: 'run-1' };
const MCP_RUN = {
  id: 'run-1',
  status: RunStatus.COMPLETED,
  suiteSnapshot: { overallScoreThreshold: 0.5, suiteType: SuiteType.McpTool },
};
const UNPRICED_MODEL_RUN = {
  id: 'run-1',
  status: RunStatus.COMPLETED,
  suiteSnapshot: {
    overallScoreThreshold: 0.5,
    deploymentRef: { id: 'gpt-unpriced', name: 'gpt-unpriced', type: DeploymentType.Model },
  },
};
const PRICED_MODEL_RUN = {
  id: 'run-1',
  status: RunStatus.COMPLETED,
  suiteSnapshot: {
    overallScoreThreshold: 0.5,
    deploymentRef: { id: 'gpt-4', name: 'gpt-4', type: DeploymentType.Model },
  },
};

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
    getPlatformModelMock.mockReset();
    getEntityModelMock.mockReset();
    getPlatformModelMock.mockResolvedValue(null);
    getEntityModelMock.mockResolvedValue(null);
    vi.useRealTimers();
  });

  test('shows a loader until data resolves', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0.01, avgMetricEvalCost: 0.02 });
    render(<Analytics run={RUN_WITH_THRESHOLD as any} />);

    expect(screen.getByLabelText('loading-32')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Runs.TestCasesPassed')).toBeInTheDocument());
  });

  test('renders read-only overall score card when overall data is present', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0, avgMetricEvalCost: 0 });
    render(<Analytics run={RUN_WITH_THRESHOLD as any} overallScore={0.812} />);

    expect(await screen.findByText('Runs.OverallScore')).toBeInTheDocument();
    expect(screen.getByText('0.812')).toBeInTheDocument();
    expect(screen.getByText('Runs.OverallScoreDescription')).toBeInTheDocument();
  });

  test('hides overall score card when overall data is absent', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0, avgMetricEvalCost: 0 });
    render(<Analytics run={RUN_WITH_THRESHOLD as any} overallScore={null} />);

    await screen.findByText('Runs.TestCasesPassed');
    expect(screen.queryByText('Runs.OverallScore')).not.toBeInTheDocument();
  });

  test('hides overall score card while overall score is still loading', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0, avgMetricEvalCost: 0 });
    render(<Analytics run={RUN_WITH_THRESHOLD as any} />);

    await screen.findByText('Runs.TestCasesPassed');
    expect(screen.queryByText('Runs.OverallScore')).not.toBeInTheDocument();
  });

  test('renders passed test cases card with N/M value and status breakdown', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0, avgMetricEvalCost: 0 });
    render(<Analytics run={RUN_WITH_THRESHOLD as any} />);

    await screen.findByText('37');
    await screen.findByText('/ 43');
    expect(screen.getByText('37 Runs.Pass')).toBeInTheDocument();
    expect(screen.getByText('3 Runs.Fail')).toBeInTheDocument();
    expect(screen.getByText('3 Runs.ExecError')).toBeInTheDocument();
  });

  test('renders average run time card in seconds', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0, avgMetricEvalCost: 0 });
    render(<Analytics run={RUN_WITH_THRESHOLD as any} />);

    expect(await screen.findByText('0.2 Runs.Seconds')).toBeInTheDocument();
  });

  test('renders average metric-eval latency card in seconds', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0, avgMetricEvalCost: 0 });
    render(<Analytics run={RUN_WITH_THRESHOLD as any} />);

    expect(await screen.findByText('Runs.AvgMetricEvalLatency')).toBeInTheDocument();
    expect(screen.getByText('291.1 Runs.Seconds')).toBeInTheDocument();
  });

  test('marks cards as error when the run has no data', async () => {
    executeStructuredQueryMock.mockResolvedValue({ rows: [] });
    mockCosts({ avgTestCaseCost: 0, avgMetricEvalCost: 0 });
    render(<Analytics run={RUN_WITH_THRESHOLD as any} overallScore={null} />);

    await waitFor(() => expect(screen.getAllByText('error-tag').length).toBeGreaterThanOrEqual(3));
  });

  test('shows real cost data rather than an error when test_case_eval_scores lags behind eval_summaries', async () => {
    // A run can have real timing (eval_summaries) and cost data well before its per-test-case
    // pass/fail rows (test_case_eval_scores) land — the two are populated by different backend
    // stages. The cost cards must key off the run's own cost fetch, not off that unrelated,
    // possibly-still-empty entity.
    executeStructuredQueryMock.mockImplementation((query: StructuredQuery) => {
      if (query.group_by) {
        return Promise.resolve({ rows: [] });
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
    mockCosts({ avgTestCaseCost: 0.0123, avgMetricEvalCost: 1.5 });

    render(<Analytics run={{ ...RUN_WITH_THRESHOLD, status: RunStatus.COMPLETED } as any} />);

    expect(await screen.findByText('$0.012')).toBeInTheDocument();
    expect(screen.getByText('$1.5')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Runs.TestCaseLlmCost' })).not.toHaveTextContent('error-tag');
    expect(screen.queryByRole('region', { name: 'Runs.MetricEvalCost' })).not.toHaveTextContent('error-tag');
  });

  test('renders cost cards with dollar values', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0.0123, avgMetricEvalCost: 1.5 });
    render(<Analytics run={RUN_WITH_THRESHOLD as any} />);

    expect(await screen.findByText('Runs.TestCaseLlmCost')).toBeInTheDocument();
    expect(screen.getByText('Runs.MetricEvalCost')).toBeInTheDocument();
    expect(screen.getByText('$0.012')).toBeInTheDocument();
    expect(screen.getByText('$1.5')).toBeInTheDocument();
    expect(screen.getAllByText('Runs.AvgPerTestCase').length).toBeGreaterThanOrEqual(2);
  });

  test('renders em dash when a cost field is null', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: null, avgMetricEvalCost: 0 });
    render(<Analytics run={RUN_WITH_THRESHOLD as any} />);

    expect(await screen.findByText('Runs.TestCaseLlmCost')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  test('settles Metric-Eval Cost to a dash immediately when the run computed zero metrics', async () => {
    mockQueries();
    getRunCostsMock.mockReturnValue(new Promise(() => undefined));
    render(<Analytics run={RUN_WITH_THRESHOLD as any} metricSnapshotCount={0} />);

    expect(await screen.findByText('Runs.TestCasesPassed')).toBeInTheDocument();

    const metricEvalCard = screen.getByRole('region', { name: 'Runs.MetricEvalCost' });
    expect(within(metricEvalCard).getByText('—')).toBeInTheDocument();
    expect(within(metricEvalCard).queryByText('Runs.Calculating')).not.toBeInTheDocument();
    expect(within(metricEvalCard).queryByText('error-tag')).not.toBeInTheDocument();

    // Test Case LLM Cost is unaffected — it can still resolve to a real figure, so it keeps waiting.
    const testCaseCard = screen.getByRole('region', { name: 'Runs.TestCaseLlmCost' });
    expect(within(testCaseCard).getByText('Runs.Calculating')).toBeInTheDocument();
  });

  test('keeps Metric-Eval Cost sharing the Calculating state when the run computed at least one metric', async () => {
    mockQueries();
    getRunCostsMock.mockReturnValue(new Promise(() => undefined));
    render(<Analytics run={RUN_WITH_THRESHOLD as any} metricSnapshotCount={2} />);

    expect(await screen.findByText('Runs.TestCasesPassed')).toBeInTheDocument();
    expect(screen.getAllByText('Runs.Calculating')).toHaveLength(2);
  });

  test('does not show the Metric-Eval dash early while the metric snapshot count is still unknown', async () => {
    mockQueries();
    getRunCostsMock.mockReturnValue(new Promise(() => undefined));
    render(<Analytics run={RUN_WITH_THRESHOLD as any} />);

    expect(await screen.findByText('Runs.TestCasesPassed')).toBeInTheDocument();
    expect(screen.getAllByText('Runs.Calculating')).toHaveLength(2);
  });

  test('settles Metric-Eval Cost to a dash, not the Error badge, for a no-metrics run with no results', async () => {
    executeStructuredQueryMock.mockResolvedValue({ rows: [] });
    render(<Analytics run={{ ...RUN_WITH_THRESHOLD, status: RunStatus.COMPLETED } as any} metricSnapshotCount={0} />);

    const metricEvalCard = await screen.findByRole('region', { name: 'Runs.MetricEvalCost' });
    expect(within(metricEvalCard).getByText('—')).toBeInTheDocument();
    expect(within(metricEvalCard).queryByText('error-tag')).not.toBeInTheDocument();

    // The rest of the strip still errors as usual for a settled run with no results.
    const testCaseCard = screen.getByRole('region', { name: 'Runs.TestCaseLlmCost' });
    expect(within(testCaseCard).getByText('error-tag')).toBeInTheDocument();
  });

  test('shows Error on cost cards without dropping other KPI cards when costs are unavailable', async () => {
    mockQueries();
    mockCosts(null);
    render(<Analytics run={RUN_WITH_THRESHOLD as any} />);

    expect(await screen.findByText('Runs.TestCasesPassed')).toBeInTheDocument();
    expect(screen.getByText('0.2 Runs.Seconds')).toBeInTheDocument();
    expect(screen.getByText('Runs.TestCaseLlmCost')).toBeInTheDocument();
    expect(screen.getByText('Runs.MetricEvalCost')).toBeInTheDocument();
    const costRegions = [
      screen.getByRole('region', { name: 'Runs.TestCaseLlmCost' }),
      screen.getByRole('region', { name: 'Runs.MetricEvalCost' }),
    ];
    for (const region of costRegions) {
      expect(region).toHaveTextContent('error-tag');
    }
  });

  test('shows Calculating on cost cards while costs resolve after analytics', async () => {
    mockQueries();
    let resolveCosts: (value: { avgTestCaseCost: number; avgMetricEvalCost: number }) => void = () => undefined;
    getRunCostsMock.mockReturnValue(
      new Promise((resolve) => {
        resolveCosts = resolve;
      }),
    );

    render(<Analytics run={RUN_WITH_THRESHOLD as any} />);

    expect(await screen.findByText('Runs.TestCasesPassed')).toBeInTheDocument();
    expect(screen.getAllByText('Runs.Calculating')).toHaveLength(2);
    expect(screen.getAllByText('Runs.CostCalculatingElapsed')).toHaveLength(2);

    resolveCosts({ avgTestCaseCost: 0.5, avgMetricEvalCost: 0.25 });
    expect(await screen.findByText('$0.5')).toBeInTheDocument();
    expect(screen.getByText('$0.25')).toBeInTheDocument();
    expect(screen.queryByText('Runs.Calculating')).not.toBeInTheDocument();
  });

  test.each([
    ['all-null averages', { avgTestCaseCost: null, avgMetricEvalCost: null }],
    ['an empty body degraded to a string', ''],
  ])(
    'keeps Calculating rather than showing a dash when the costs payload carries no figures (%s)',
    async (_label, notReady) => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      mockQueries();
      getRunCostsMock.mockResolvedValueOnce(notReady).mockResolvedValue({
        avgTestCaseCost: 0.5,
        avgMetricEvalCost: 0.25,
      });

      render(<Analytics run={RUN_WITH_THRESHOLD as any} />);

      expect(await screen.findByText('Runs.TestCasesPassed')).toBeInTheDocument();
      await waitFor(() => expect(getRunCostsMock).toHaveBeenCalledTimes(1));
      expect(screen.getAllByText('Runs.Calculating')).toHaveLength(2);
      expect(screen.queryByText('—')).not.toBeInTheDocument();

      await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS);

      await waitFor(() => expect(screen.getByText('$0.5')).toBeInTheDocument());
      expect(screen.getByText('$0.25')).toBeInTheDocument();
      expect(screen.queryByText('Runs.Calculating')).not.toBeInTheDocument();
    },
  );

  test('keeps Calculating indefinitely while the backend has no figures', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockQueries();
    getRunCostsMock.mockResolvedValue({ avgTestCaseCost: null, avgMetricEvalCost: null });

    render(<Analytics run={RUN_WITH_THRESHOLD as any} />);

    expect(await screen.findByText('Runs.TestCasesPassed')).toBeInTheDocument();
    expect(screen.getAllByText('Runs.Calculating')).toHaveLength(2);

    await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS * 100);

    expect(screen.getAllByText('Runs.Calculating')).toHaveLength(2);
    expect(screen.queryByText('error-tag')).not.toBeInTheDocument();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });

  test('shows Error on cost cards when a later poll hits an endpoint error', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockQueries();
    getRunCostsMock.mockResolvedValueOnce({ avgTestCaseCost: null, avgMetricEvalCost: null }).mockResolvedValue(null);

    render(<Analytics run={RUN_WITH_THRESHOLD as any} />);

    expect(await screen.findByText('Runs.TestCasesPassed')).toBeInTheDocument();
    expect(screen.getAllByText('Runs.Calculating')).toHaveLength(2);

    await vi.advanceTimersByTimeAsync(COST_FETCH_POLL_INTERVAL_MS);

    await waitFor(() => {
      const costRegions = [
        screen.getByRole('region', { name: 'Runs.TestCaseLlmCost' }),
        screen.getByRole('region', { name: 'Runs.MetricEvalCost' }),
      ];
      for (const region of costRegions) {
        expect(region).toHaveTextContent('error-tag');
      }
    });
    expect(screen.queryByText('Runs.Calculating')).not.toBeInTheDocument();
    expect(screen.getByText('Runs.TestCasesPassed')).toBeInTheDocument();
  });

  test('hides the test cases passed card when the run snapshot has no threshold', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0, avgMetricEvalCost: 0 });
    render(<Analytics run={RUN_WITHOUT_THRESHOLD as any} />);

    expect(await screen.findByText('Runs.AvgTestCaseRunTime')).toBeInTheDocument();
    expect(screen.queryByText('Runs.TestCasesPassed')).not.toBeInTheDocument();
  });

  test.each([RunStatus.RUNNING, RunStatus.CANCELLING, RunStatus.CANCELLED])(
    'renders dashes instead of error tags for a %s run with no data',
    async (status) => {
      executeStructuredQueryMock.mockResolvedValue({ rows: [] });
      mockCosts(null);
      render(<Analytics run={{ ...RUN_WITH_THRESHOLD, status } as any} overallScore={null} />);

      await screen.findByText('Runs.TestCasesPassed');
      // The two cost cards settle after the query cards, so the count is awaited rather than read once:
      // read immediately, it catches them still loading whenever the suite runs slowly enough.
      await waitFor(() => expect(screen.getAllByText('—')).toHaveLength(5));
      expect(screen.queryByText('error-tag')).not.toBeInTheDocument();
    },
  );

  test('does not fetch costs for a run that is still in progress', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0.5, avgMetricEvalCost: 0.25 });
    render(<Analytics run={{ ...RUN_WITH_THRESHOLD, status: RunStatus.RUNNING } as any} />);

    expect(await screen.findByText('Runs.TestCasesPassed')).toBeInTheDocument();
    expect(getRunCostsMock).not.toHaveBeenCalled();
    expect(screen.queryByText('Runs.Calculating')).not.toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  test('does not fetch costs for an MCP-tool run, regardless of metrics computed', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0.5, avgMetricEvalCost: 0.25 });
    render(<Analytics run={MCP_RUN as any} />);

    expect(await screen.findByText('Runs.TestCasesPassed')).toBeInTheDocument();
    expect(getRunCostsMock).not.toHaveBeenCalled();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  test('settles to a dash and stops polling once the deployed model is confirmed to have no pricing', async () => {
    mockQueries();
    getRunCostsMock.mockReturnValue(new Promise(() => undefined));
    getPlatformModelMock.mockResolvedValue({ response: { name: 'gpt-unpriced', pricing: undefined } });
    render(<Analytics run={UNPRICED_MODEL_RUN as any} />);

    expect(await screen.findByText('Runs.TestCasesPassed')).toBeInTheDocument();
    // The pricing check resolves after the cost fetch has already started on the optimistic guess
    // that costs are possible — the fix is that it then stops the wait rather than never resolving it.
    await waitFor(() => expect(screen.getAllByText('—')).toHaveLength(2));
    expect(getRunCostsMock.mock.calls.length).toBeLessThanOrEqual(1);
  });

  test('still fetches costs for a model confirmed to have pricing configured', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0.5, avgMetricEvalCost: 0.25 });
    getPlatformModelMock.mockResolvedValue({ response: { name: 'gpt-4', pricing: { prompt: '0.001' } } });
    render(<Analytics run={PRICED_MODEL_RUN as any} />);

    expect(await screen.findByText('$0.5')).toBeInTheDocument();
    await waitFor(() => expect(getRunCostsMock).toHaveBeenCalled());
  });

  test('does not block the cost fetch while the pricing check is still pending', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0.5, avgMetricEvalCost: 0.25 });
    getPlatformModelMock.mockReturnValue(new Promise(() => undefined));
    render(<Analytics run={UNPRICED_MODEL_RUN as any} />);

    expect(await screen.findByText('Runs.TestCasesPassed')).toBeInTheDocument();
    await waitFor(() => expect(getRunCostsMock).toHaveBeenCalled());
  });

  test('still marks cards as error for a stopped run once data is present', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0.5, avgMetricEvalCost: 0.25 });
    render(<Analytics run={{ ...RUN_WITH_THRESHOLD, status: RunStatus.CANCELLED } as any} />);

    expect(await screen.findByText('0.2 Runs.Seconds')).toBeInTheDocument();
    expect(screen.getByText('37')).toBeInTheDocument();
    expect(screen.queryByText('error-tag')).not.toBeInTheDocument();
  });

  test('marks cards as error for a completed run with no data', async () => {
    executeStructuredQueryMock.mockResolvedValue({ rows: [] });
    mockCosts(null);
    render(<Analytics run={{ ...RUN_WITH_THRESHOLD, status: RunStatus.COMPLETED } as any} overallScore={null} />);

    await waitFor(() => expect(screen.getAllByText('error-tag').length).toBe(5));
  });

  test('shows the test cases passed card when the snapshotted threshold is 0', async () => {
    mockQueries();
    mockCosts({ avgTestCaseCost: 0, avgMetricEvalCost: 0 });
    render(<Analytics run={{ id: 'run-1', suiteSnapshot: { overallScoreThreshold: 0 } } as any} />);

    expect(await screen.findByText('Runs.TestCasesPassed')).toBeInTheDocument();
  });
});
