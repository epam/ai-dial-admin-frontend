import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { ErrorI18nKey, RunsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { DeploymentType } from '@/src/models/evaluation/deployment';
import { Run, RunStatus } from '@/src/models/evaluation/run';
import { StructuredQuery } from '@/src/models/evaluation/structured-query';
import { OverallScoreConfig, OverallScoreType, SuiteSnapshot } from '@/src/models/evaluation/test-suite';
import Analytics from '../Analytics';

const executeStructuredQueryMock = vi.fn();
const getRunsTotalCostsMock = vi.fn();
const getPlatformModelMock = vi.fn();
const getEntityModelMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  executeStructuredQuery: (query: StructuredQuery) => executeStructuredQueryMock(query),
  getRunsTotalCosts: (ids: string[]) => getRunsTotalCostsMock(ids),
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
    Spinner: ({ size }: { size: number }) => <div aria-label={`loading-${size}`} />,
    AnalyticsCard: ({ title, value, description, error, className }: any) => (
      <div role="region" className={className} aria-label={typeof title === 'string' ? title : undefined}>
        <div>{title}</div>
        {error ? <span>error-tag</span> : <div>{value}</div>}
        {!error && <div>{description}</div>}
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
const RUN_TIME_ROWS = { rows: [{ total_duration_ms: 341000 }] };
const METRIC_EVAL_ROWS = { rows: [{ total_metric_eval_duration_ms: 291123.6 }] };

const buildRun = (overrides: Partial<Run> = {}): Run => ({
  id: 'run-1',
  status: RunStatus.COMPLETED,
  completedAt: Date.now(),
  suiteSnapshot: {
    overallScoreThreshold: 0.5,
    deploymentRef: { id: 'gpt-4', name: 'gpt-4', type: DeploymentType.Model },
  },
  ...overrides,
});

const totals = (testCaseCost: number | null, metricEvalCost: number | null) => [
  { runId: 'run-1', totalCost: (testCaseCost ?? 0) + (metricEvalCost ?? 0), testCaseCost, metricEvalCost },
];

const mockQueries = (status = STATUS_ROWS, runTime = RUN_TIME_ROWS, metricEval = METRIC_EVAL_ROWS) => {
  executeStructuredQueryMock.mockImplementation((query: StructuredQuery) => {
    if (query.group_by) {
      return Promise.resolve(status);
    }
    const alias = query.select?.[0]?.as;
    if (alias === 'total_duration_ms') {
      return Promise.resolve(runTime);
    }
    if (alias === 'total_metric_eval_duration_ms') {
      return Promise.resolve(metricEval);
    }
    return Promise.resolve({ rows: [] });
  });
};

const execution = (testCaseId: string, status: string, count = 1) => ({
  test_case_id: testCaseId,
  execution_status: status,
  count,
});

/** A run whose suite has no metrics: the scores table is empty, the executions are `executions`. */
const mockNoMetricsQueries = (executions: unknown[]) => {
  executeStructuredQueryMock.mockImplementation((query: StructuredQuery) => {
    if (query.entity === 'test_case_eval_scores') {
      return Promise.resolve({ rows: [] });
    }
    if (query.group_by) {
      return Promise.resolve({ rows: executions });
    }
    const alias = query.select?.[0]?.as;
    return Promise.resolve(alias === 'total_duration_ms' ? RUN_TIME_ROWS : { rows: [] });
  });
};

const renderLoaded = async (props: Partial<React.ComponentProps<typeof Analytics>> = {}) => {
  render(<Analytics run={buildRun()} {...props} />);
  await screen.findByRole('region', { name: RunsI18nKey.TestCasesCompleted });
};

const card = (title: string) => screen.getByRole('region', { name: title });

describe('Runs Summary :: Analytics', () => {
  beforeEach(() => {
    executeStructuredQueryMock.mockReset();
    getRunsTotalCostsMock.mockReset();
    getPlatformModelMock.mockReset();
    getEntityModelMock.mockReset();
    getPlatformModelMock.mockResolvedValue({ response: { name: 'gpt-4', pricing: { prompt: '0.001' } } });
    getEntityModelMock.mockResolvedValue(null);
    mockQueries();
    getRunsTotalCostsMock.mockResolvedValue(totals(100, 20));
  });

  test('shows a loader until data resolves', async () => {
    render(<Analytics run={buildRun()} />);

    expect(screen.getByLabelText('loading-32')).toBeInTheDocument();
    expect(await screen.findByRole('region', { name: RunsI18nKey.TestCasesCompleted })).toBeInTheDocument();
  });

  test('renders the five cards in order for a suite with a threshold', async () => {
    await renderLoaded({ overallScore: 0.812 });

    expect(screen.getAllByRole('region').map((region) => region.getAttribute('aria-label'))).toEqual([
      RunsI18nKey.TestCasesCompleted,
      RunsI18nKey.ThresholdPassRate,
      RunsI18nKey.OverallScore,
      RunsI18nKey.TotalRuntime,
      RunsI18nKey.TotalRunCost,
    ]);
  });

  test('titles the rate card Completion Rate when the snapshot has no threshold', async () => {
    await renderLoaded({ run: buildRun({ suiteSnapshot: {} }) });

    expect(screen.getByRole('region', { name: RunsI18nKey.CompletionRate })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: RunsI18nKey.ThresholdPassRate })).not.toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.TrendsThresholdLabel)).not.toBeInTheDocument();
  });

  test('keeps content right under the title on every card except the one with a pinned footer', async () => {
    mockQueries({ rows: [] }, { rows: [] }, { rows: [] });
    getRunsTotalCostsMock.mockResolvedValue(totals(null, null));
    await renderLoaded({ run: buildRun({ status: RunStatus.CANCELLED, completedAt: 1 }), overallScore: 0.812 });
    await waitFor(() => expect(within(card(RunsI18nKey.TotalRunCost)).queryByRole('status')).toBeNull());

    for (const title of [
      RunsI18nKey.TestCasesCompleted,
      // A threshold needs score rows; this run has none, so it is rated by completion.
      RunsI18nKey.CompletionRate,
      RunsI18nKey.TotalRuntime,
      RunsI18nKey.TotalRunCost,
    ]) {
      expect(within(card(title)).getByText('—')).toBeTruthy();
      expect(card(title).className).toContain('justify-start');
      expect(card(title).className).not.toContain('justify-between');
    }
    expect(card(RunsI18nKey.OverallScore).className).toContain('justify-between');
  });

  test('no longer renders the superseded cards', async () => {
    await renderLoaded({ overallScore: 0.812 });

    for (const key of [
      'TestCasesPassed',
      'AvgTestCaseRunTime',
      'AvgMetricEvalLatency',
      'TestCaseLlmCost',
      'MetricEvalCost',
    ]) {
      expect(screen.queryByText(`Runs.${key}`)).not.toBeInTheDocument();
    }
  });

  test('shows completed over total with the Error-or-N/A line on Test Cases Completed', async () => {
    await renderLoaded();

    const completed = within(card(RunsI18nKey.TestCasesCompleted));
    expect(completed.getByText('40')).toBeInTheDocument();
    expect(completed.getByText('/43')).toBeInTheDocument();
    expect(completed.getByText('3')).toBeInTheDocument();
  });

  test('shows the threshold pass rate with its bar and threshold line', async () => {
    await renderLoaded();

    const rate = within(card(RunsI18nKey.ThresholdPassRate));
    expect(rate.getByText('86%')).toBeInTheDocument();
    expect(rate.getByRole('progressbar', { name: RunsI18nKey.ThresholdPassRate })).toBeInTheDocument();
    expect(rate.getByText('0.5')).toBeInTheDocument();
  });

  test('shows the overall score with its glyph, footer and info control', async () => {
    await renderLoaded({ overallScore: 0.812, metricSnapshotCount: 3 });

    const overall = within(card(RunsI18nKey.OverallScore));
    expect(overall.getByText('0.812')).toBeInTheDocument();
    expect(overall.getByText(TestSuitesI18nKey.TrendsBasedOnCompletedStatic)).toBeInTheDocument();
    expect(overall.getByRole('button', { name: TestSuitesI18nKey.OverallScoreCalculationMethod })).toBeInTheDocument();
  });

  test('omits the info control for a run that has no suite snapshot', async () => {
    await renderLoaded({ run: buildRun({ suiteSnapshot: undefined }), overallScore: 0.812 });

    expect(
      within(card(RunsI18nKey.OverallScore)).queryByRole('button', {
        name: TestSuitesI18nKey.OverallScoreCalculationMethod,
      }),
    ).not.toBeInTheDocument();
  });

  describe('the calculation method tooltip', () => {
    const snapshotWith = (overallScore?: OverallScoreConfig): SuiteSnapshot => ({
      overallScoreThreshold: 0.5,
      deploymentRef: { id: 'gpt-4', name: 'gpt-4', type: DeploymentType.Model },
      ...(overallScore ? { overallScore } : {}),
    });
    const openMethodTooltip = async (run: Run) => {
      const user = userEvent.setup();
      await renderLoaded({ run, overallScore: 0.812, metricSnapshotCount: 2 });
      await user.hover(
        within(card(RunsI18nKey.OverallScore)).getByRole('button', {
          name: TestSuitesI18nKey.OverallScoreCalculationMethod,
        }),
      );
      return (await screen.findByRole('tooltip')).textContent ?? '';
    };

    test('describes the weighted mean stored on the run, with its stored weights', async () => {
      const text = await openMethodTooltip(
        buildRun({
          suiteSnapshot: snapshotWith({
            type: OverallScoreType.WeightedMean,
            weights: [
              { metricName: 'aidial_rag_eval.retrieval', outputField: 'f1', weight: 0.7 },
              { metricName: 'deepeval.context_prec', outputField: 'score', weight: 0.3 },
            ],
          }),
        }),
      );

      expect(text).toContain(TestSuitesI18nKey.TrendsWeightedMeanOfNMetrics);
      expect(text).toContain('aidial_rag_eval.retrieval.f1 × 0.7');
      expect(text).toContain('deepeval.context_prec.score × 0.3');
    });

    test('describes the mean stored on the run', async () => {
      const text = await openMethodTooltip(buildRun({ suiteSnapshot: snapshotWith({ type: OverallScoreType.Mean }) }));

      expect(text).toContain(TestSuitesI18nKey.TrendsMeanOfNMetrics);
      expect(text).toContain(TestSuitesI18nKey.OverallScoreMeanFormula);
    });

    test('describes a snapshot that stores no method as the default mean', async () => {
      const text = await openMethodTooltip(buildRun({ suiteSnapshot: snapshotWith() }));

      expect(text).toContain(TestSuitesI18nKey.TrendsMeanOfNMetrics);
    });

    test('shows the control without any test suite being loaded', async () => {
      await renderLoaded({ overallScore: 0.812 });

      expect(
        within(card(RunsI18nKey.OverallScore)).getByRole('button', {
          name: TestSuitesI18nKey.OverallScoreCalculationMethod,
        }),
      ).toBeInTheDocument();
    });
  });

  test.each([[null], [undefined]])('omits the overall score card when the score is %s', async (overallScore) => {
    await renderLoaded({ overallScore });

    expect(screen.queryByRole('region', { name: RunsI18nKey.OverallScore })).not.toBeInTheDocument();
  });

  test('shows the total runtime with the source kind and metrics breakdown', async () => {
    await renderLoaded();

    const runtime = within(card(RunsI18nKey.TotalRuntime));
    expect(runtime.getByText('10m 32s')).toBeInTheDocument();
    expect(runtime.getByText('Model:')).toBeInTheDocument();
    expect(runtime.getByText('5m 41s')).toBeInTheDocument();
    expect(runtime.getByText('4m 51s')).toBeInTheDocument();
  });

  test('falls back to a generic source label when the kind cannot be resolved', async () => {
    await renderLoaded({ run: buildRun({ suiteSnapshot: { overallScoreThreshold: 0.5 } }) });

    expect(
      within(card(RunsI18nKey.TotalRuntime)).getByText(`${TestSuitesI18nKey.TrendsSourceFallback}:`),
    ).toBeInTheDocument();
  });

  test('shows only the present runtime part and a dash for the other', async () => {
    mockQueries(STATUS_ROWS, RUN_TIME_ROWS, { rows: [] });
    await renderLoaded();

    const runtime = within(card(RunsI18nKey.TotalRuntime));
    expect(runtime.getAllByText('5m 41s')).toHaveLength(2);
    expect(runtime.getByText('—')).toBeInTheDocument();
  });

  test('shows the total run cost with its source and metrics split', async () => {
    await renderLoaded();

    const cost = within(card(RunsI18nKey.TotalRunCost));
    expect(await cost.findByText('$120')).toBeInTheDocument();
    expect(cost.getByText('$100')).toBeInTheDocument();
    expect(cost.getByText('$20')).toBeInTheDocument();
  });

  test('dashes only the metrics value when the metrics cost is absent', async () => {
    getRunsTotalCostsMock.mockResolvedValue(totals(0.42, null));
    await renderLoaded();

    const cost = within(card(RunsI18nKey.TotalRunCost));
    expect(await cost.findAllByText('$0.42')).toHaveLength(2);
    expect(cost.getByText('—')).toBeInTheDocument();
    expect(cost.queryByText('error-tag')).not.toBeInTheDocument();
  });

  test('shows Calculating on the cost card while the totals are still coming, without hiding other cards', async () => {
    getRunsTotalCostsMock.mockReturnValue(new Promise(() => undefined));
    await renderLoaded();

    expect(within(card(RunsI18nKey.TotalRunCost)).getByRole('status')).toHaveTextContent(RunsI18nKey.Calculating);
    expect(within(card(RunsI18nKey.TotalRuntime)).getByText('5m 41s')).toBeInTheDocument();
  });

  test('settles the Metrics value to a dash while a run without metrics is still calculating its cost', async () => {
    getRunsTotalCostsMock.mockReturnValue(new Promise(() => undefined));
    await renderLoaded({ metricSnapshotCount: 0 });

    const cost = within(card(RunsI18nKey.TotalRunCost));
    expect(cost.getByText('—')).toBeInTheDocument();
    expect(cost.queryByText(RunsI18nKey.CostCalculatingElapsed)).not.toBeInTheDocument();
  });

  test('shows Error on the cost card only when the totals request fails', async () => {
    getRunsTotalCostsMock.mockResolvedValue(null);
    await renderLoaded();

    await waitFor(() => expect(within(card(RunsI18nKey.TotalRunCost)).getByText('error-tag')).toBeInTheDocument());
    expect(within(card(RunsI18nKey.TotalRuntime)).queryByText('error-tag')).not.toBeInTheDocument();
    expect(within(card(RunsI18nKey.TestCasesCompleted)).queryByText('error-tag')).not.toBeInTheDocument();
  });

  test('marks the data cards as Error for a completed run with no results', async () => {
    mockQueries({ rows: [] }, { rows: [] }, { rows: [] });
    getRunsTotalCostsMock.mockResolvedValue(totals(null, null));
    render(<Analytics run={buildRun({ completedAt: 1 })} />);

    await waitFor(() => expect(screen.getAllByText('error-tag')).toHaveLength(4));
  });

  test('shows dashes instead of Error for the same run in an incomplete status', async () => {
    mockQueries({ rows: [] }, { rows: [] }, { rows: [] });
    getRunsTotalCostsMock.mockResolvedValue(totals(null, null));
    render(<Analytics run={buildRun({ status: RunStatus.CANCELLED, completedAt: 1 })} />);

    await screen.findByRole('region', { name: RunsI18nKey.TestCasesCompleted });
    await waitFor(() => expect(within(card(RunsI18nKey.TotalRunCost)).getAllByText('—')).toHaveLength(1));
    expect(screen.queryByText('error-tag')).not.toBeInTheDocument();
  });

  test('does not request costs for a run that is still running', async () => {
    await renderLoaded({ run: buildRun({ status: RunStatus.RUNNING }) });

    expect(getRunsTotalCostsMock).not.toHaveBeenCalled();
    expect(within(card(RunsI18nKey.TotalRunCost)).queryByRole('status')).not.toBeInTheDocument();
  });
  describe('a run whose suite has no metrics', () => {
    const renderNoMetrics = async (
      executions: unknown[],
      run: Partial<Run> = { numberOfTestCases: 4, suiteSnapshot: {} },
    ) => {
      mockNoMetricsQueries(executions);
      await renderLoaded({ run: buildRun(run) });
    };
    const completedCard = () => within(card(RunsI18nKey.TestCasesCompleted));

    test('shows completed over total, no error line, and a full Completion Rate', async () => {
      await renderNoMetrics([
        execution('a', 'SUCCESS'),
        execution('b', 'SUCCESS'),
        execution('c', 'SUCCESS'),
        execution('d', 'SUCCESS'),
      ]);

      expect(completedCard().getByText('4', { selector: 'span.dial-display2-text' })).toBeInTheDocument();
      expect(completedCard().getByText('/4')).toBeInTheDocument();
      expect(completedCard().queryByText(ErrorI18nKey.Error)).not.toBeInTheDocument();
      expect(within(card(RunsI18nKey.CompletionRate)).getByText('100%')).toBeInTheDocument();
      expect(screen.queryByText('error-tag')).not.toBeInTheDocument();
    });

    test('counts repeat executions of a test case once', async () => {
      await renderNoMetrics([execution('a', 'SUCCESS', 3), execution('b', 'SUCCESS', 3)], {
        numberOfTestCases: 2,
        suiteSnapshot: {},
      });

      expect(completedCard().getByText('/2')).toBeInTheDocument();
      expect(completedCard().queryByText('/6')).not.toBeInTheDocument();
    });

    test('does not complete a test case with a failed execution', async () => {
      await renderNoMetrics(
        [execution('a', 'SUCCESS'), execution('a', 'FAILED'), execution('b', 'SUCCESS'), execution('c', 'SUCCESS')],
        { numberOfTestCases: 3, suiteSnapshot: {} },
      );

      expect(completedCard().getByText('2', { selector: 'span.dial-display2-text' })).toBeInTheDocument();
      expect(completedCard().getByText('/3')).toBeInTheDocument();
      expect(completedCard().getByText(ErrorI18nKey.Error)).toBeInTheDocument();
      expect(within(card(RunsI18nKey.CompletionRate)).getByText('66.7%')).toBeInTheDocument();
    });

    test('shows a test case that never executed as N/A', async () => {
      const user = userEvent.setup();
      await renderNoMetrics([execution('a', 'SUCCESS')], { numberOfTestCases: 3, suiteSnapshot: {} });

      expect(completedCard().getByText('/3')).toBeInTheDocument();
      await user.hover(completedCard().getByText('1', { selector: 'span.dial-display2-text' }));

      const tooltip = await screen.findByRole('tooltip');
      expect(tooltip.textContent).toContain(TestSuitesI18nKey.TrendsTestCasesErrorOrNa);
      expect(tooltip.textContent).not.toContain(TestSuitesI18nKey.TrendsScoreAboveThreshold);
      expect(tooltip.textContent).not.toContain(TestSuitesI18nKey.TrendsScoreBelowThreshold);
    });

    test('rates a threshold without score rows by completion', async () => {
      await renderNoMetrics([execution('a', 'SUCCESS'), execution('b', 'SUCCESS')], {
        numberOfTestCases: 2,
        suiteSnapshot: { overallScoreThreshold: 0.5 },
      });

      expect(screen.getByRole('region', { name: RunsI18nKey.CompletionRate })).toBeInTheDocument();
      expect(screen.queryByRole('region', { name: RunsI18nKey.ThresholdPassRate })).not.toBeInTheDocument();
      expect(screen.queryByText(TestSuitesI18nKey.TrendsThresholdLabel)).not.toBeInTheDocument();
    });

    test('still shows Error for a COMPLETED run that reports no test cases at all', async () => {
      await renderNoMetrics([], { numberOfTestCases: 0, suiteSnapshot: {} });

      expect(completedCard().getByText('error-tag')).toBeInTheDocument();
    });

    test('counts only what an in-flight run has seen, not its reported total', async () => {
      await renderNoMetrics([execution('a', 'SUCCESS'), execution('b', 'SUCCESS'), execution('c', 'SUCCESS')], {
        status: RunStatus.RUNNING,
        numberOfTestCases: 10,
        suiteSnapshot: {},
      });

      expect(completedCard().getByText('/3')).toBeInTheDocument();
      expect(completedCard().queryByText(ErrorI18nKey.Error)).not.toBeInTheDocument();
    });

    test('keeps the per-test-case scores for a run that has them', async () => {
      await renderLoaded({ run: buildRun({ numberOfTestCases: 99 }) });

      expect(completedCard().getByText('/43')).toBeInTheDocument();
      expect(
        executeStructuredQueryMock.mock.calls.every(([query]) => query.entity !== 'eval_summaries' || !query.group_by),
      ).toBe(true);
    });
  });
});
