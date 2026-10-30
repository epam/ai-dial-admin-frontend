import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ComponentProps, ReactNode } from 'react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getCompareRuns } from '@/src/components/Runs/Compare/utils';
import { RunAnalyticsSlice } from '@/src/components/Runs/Summary/models';
import { ErrorI18nKey, RunsI18nKey, TestSuitesI18nKey } from '@/src/constants/i18n';
import { DeploymentType } from '@/src/models/evaluation/deployment';
import { Run, RunStatus } from '@/src/models/evaluation/run';
import { StructuredQuery } from '@/src/models/evaluation/structured-query';
import { OverallScoreType, TestSuite } from '@/src/models/evaluation/test-suite';
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
  const { useId } = await import('react');

  const MockCard = ({
    title,
    description,
    compareValues,
    delta,
    deltaPositive,
    deltaUnit,
    error,
    className,
  }: {
    title: ReactNode;
    description?: ReactNode;
    compareValues?: { title: ReactNode; value: ReactNode }[];
    delta?: number;
    deltaPositive?: boolean;
    deltaUnit?: string;
    error?: boolean;
    className?: string;
  }) => {
    const titleId = useId();
    return (
      <div role="region" aria-labelledby={titleId} className={className}>
        <div id={titleId}>{title}</div>
        {delta != null && <span>{`delta:${delta}${deltaUnit ?? ''}`}</span>}
        {deltaPositive === false && <span>delta-negative</span>}
        {error && <span>error-tag</span>}
        {!error &&
          (compareValues ?? []).map((item, index) => (
            <div key={index} role="group" aria-label={String(item.title)}>
              {item.value}
            </div>
          ))}
        {!error && description}
      </div>
    );
  };

  return {
    ...actual,
    Spinner: ({ size }: { size: number }) => <div aria-label={`loading-${size}`} />,
    AnalyticsCard: MockCard,
  };
});

const status = (above: number, below: number, error: number) => ({
  rows: [
    { execution_status: 'SUCCESS', passed: true, count: above },
    { execution_status: 'SUCCESS', passed: false, count: below },
    { execution_status: 'ERROR', passed: null, count: error },
  ],
});
const STATUS_BY_RUN: Record<string, ReturnType<typeof status>> = {
  'run-1': status(20, 25, 10),
  'run-2': status(18, 24, 13),
};
const RUN_TIME_BY_RUN: Record<string, number> = { 'run-1': 241000, 'run-2': 351000 };

const SECONDS = RunsI18nKey.Seconds;
const MEAN_SUITE: TestSuite = { id: 'suite-1', overallScore: { type: OverallScoreType.Mean } };

const buildRun = (id: string, overrides: Partial<Run> = {}): Run => ({
  id,
  status: RunStatus.COMPLETED,
  completedAt: Date.now(),
  suiteSnapshot: {
    overallScoreThreshold: 0.6,
    deploymentRef: { id: 'gpt-4', name: 'gpt-4', type: DeploymentType.Model },
  },
  ...overrides,
});

const withoutThreshold = (id: string) =>
  buildRun(id, { suiteSnapshot: { deploymentRef: { id: 'gpt-4', name: 'gpt-4', type: DeploymentType.Model } } });

const costOf = (runId: string, testCaseCost: number | null, metricEvalCost: number | null) => [
  { runId, totalCost: (testCaseCost ?? 0) + (metricEvalCost ?? 0), testCaseCost, metricEvalCost },
];
const COSTS_BY_RUN: Record<string, ReturnType<typeof costOf>> = {
  'run-1': costOf('run-1', 100, 20),
  'run-2': costOf('run-2', 100, 10),
};

const runIdOf = (query: StructuredQuery): string =>
  JSON.stringify(query.filter).includes('run-2') ? 'run-2' : 'run-1';

const mockQueries = () => {
  executeStructuredQueryMock.mockImplementation((query: StructuredQuery) => {
    const runId = runIdOf(query);
    if (query.group_by) {
      return Promise.resolve(STATUS_BY_RUN[runId]);
    }
    const alias = query.select?.[0]?.as;
    if (alias === 'total_duration_ms') {
      return Promise.resolve({ rows: [{ total_duration_ms: RUN_TIME_BY_RUN[runId] }] });
    }
    return Promise.resolve({ rows: [] });
  });
};

const RUNS = getCompareRuns({ id: 'run-1', name: 'Run #316' }, { id: 'run-2', name: 'Run #315' });

const renderAnalytics = (overrides: Partial<ComponentProps<typeof Analytics>> = {}) =>
  render(
    <Analytics
      primaryRun={buildRun('run-1')}
      comparedRun={buildRun('run-2')}
      runs={RUNS}
      onlyMatchingTestCases={false}
      primaryMatchedAnalytics={null}
      comparedMatchedAnalytics={null}
      {...overrides}
    />,
  );

const renderLoaded = async (overrides: Partial<ComponentProps<typeof Analytics>> = {}) => {
  renderAnalytics(overrides);
  await screen.findByRole('region', { name: RunsI18nKey.TestCasesCompleted });
};

const card = (title: string | RegExp) => within(screen.getByRole('region', { name: title }));
const side = (cardTitle: string | RegExp, runName: string) =>
  within(card(cardTitle).getByRole('group', { name: runName }));

describe('Compare Summary :: Analytics', () => {
  beforeEach(() => {
    executeStructuredQueryMock.mockReset();
    getRunsTotalCostsMock.mockReset();
    getPlatformModelMock.mockReset();
    getEntityModelMock.mockReset();
    getPlatformModelMock.mockResolvedValue({ response: { name: 'gpt-4', pricing: { prompt: '0.001' } } });
    getEntityModelMock.mockResolvedValue(null);
    mockQueries();
    getRunsTotalCostsMock.mockImplementation(([id]: string[]) => Promise.resolve(COSTS_BY_RUN[id]));
  });

  test('shows a loader until both runs resolve', async () => {
    renderAnalytics();

    expect(screen.getByLabelText('loading-32')).toBeInTheDocument();
    expect(await screen.findByRole('region', { name: RunsI18nKey.TestCasesCompleted })).toBeInTheDocument();
  });

  test('renders the five cards in order', async () => {
    await renderLoaded({ primaryOverallScore: 0.812, comparedOverallScore: 0.265 });

    const names = screen.getAllByRole('region').map((region) => region.textContent ?? '');
    const titles = [
      RunsI18nKey.TestCasesCompleted,
      RunsI18nKey.ThresholdPassRate,
      RunsI18nKey.OverallScore,
      RunsI18nKey.TotalRuntime,
      RunsI18nKey.TotalRunCost,
    ];
    expect(names).toHaveLength(5);
    titles.forEach((title, index) => expect(names[index]).toContain(title));
  });

  test('shows each run beside its own Test Cases Completed value with the completed-count diff', async () => {
    await renderLoaded();

    expect(side(RunsI18nKey.TestCasesCompleted, 'Run #316').getByText('45')).toBeInTheDocument();
    expect(side(RunsI18nKey.TestCasesCompleted, 'Run #316').getByText('/55')).toBeInTheDocument();
    expect(side(RunsI18nKey.TestCasesCompleted, 'Run #315').getByText('42')).toBeInTheDocument();
    expect(card(RunsI18nKey.TestCasesCompleted).getByText('delta:-3')).toBeInTheDocument();
  });

  test('opens the breakdown tooltip headed by the run name', async () => {
    const user = userEvent.setup();
    await renderLoaded();

    await user.hover(side(RunsI18nKey.TestCasesCompleted, 'Run #315').getByText('42'));

    expect((await screen.findByRole('tooltip')).textContent).toContain('Run #315');
  });

  test('titles the rate card Threshold Pass Rate and shows per-run rates, thresholds and the percentage-point diff', async () => {
    await renderLoaded();

    expect(side(RunsI18nKey.ThresholdPassRate, 'Run #316').getByText('36.4%')).toBeInTheDocument();
    expect(side(RunsI18nKey.ThresholdPassRate, 'Run #315').getByText('32.7%')).toBeInTheDocument();
    expect(side(RunsI18nKey.ThresholdPassRate, 'Run #316').getByText('0.6')).toBeInTheDocument();
    expect(card(RunsI18nKey.ThresholdPassRate).getByText('delta:-3.7%')).toBeInTheDocument();
  });

  test('titles the rate card Completion Rate and drops the threshold lines when neither run has a threshold', async () => {
    await renderLoaded({ primaryRun: withoutThreshold('run-1'), comparedRun: withoutThreshold('run-2') });

    expect(screen.getByRole('region', { name: RunsI18nKey.CompletionRate })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: RunsI18nKey.ThresholdPassRate })).not.toBeInTheDocument();
    expect(screen.queryByText(TestSuitesI18nKey.TrendsThresholdLabel)).not.toBeInTheDocument();
    expect(card(RunsI18nKey.CompletionRate).getByText(/^delta:/)).toBeInTheDocument();
  });

  test('shows a dash for the run without a threshold and no diff when the thresholds are mixed', async () => {
    await renderLoaded({ comparedRun: withoutThreshold('run-2') });

    expect(screen.getByRole('region', { name: RunsI18nKey.ThresholdPassRate })).toBeInTheDocument();
    expect(side(RunsI18nKey.ThresholdPassRate, 'Run #315').getByText('—')).toBeInTheDocument();
    expect(side(RunsI18nKey.ThresholdPassRate, 'Run #316').getByText('36.4%')).toBeInTheDocument();
    expect(card(RunsI18nKey.ThresholdPassRate).queryByText(/^delta:/)).not.toBeInTheDocument();
  });

  test('renders both overall scores with the diff, an info control beside each and one shared footer', async () => {
    await renderLoaded({
      primaryOverallScore: 0.812,
      comparedOverallScore: 0.265,
      primaryTestSuite: MEAN_SUITE,
      comparedTestSuite: MEAN_SUITE,
    });

    const overall = card(RunsI18nKey.OverallScore);
    expect(side(RunsI18nKey.OverallScore, 'Run #316').getByText('0.812')).toBeInTheDocument();
    expect(side(RunsI18nKey.OverallScore, 'Run #315').getByText('0.265')).toBeInTheDocument();
    expect(overall.getByText('delta:-0.547')).toBeInTheDocument();
    expect(overall.getAllByRole('button', { name: TestSuitesI18nKey.OverallScoreCalculationMethod })).toHaveLength(2);
    expect(overall.getAllByText(TestSuitesI18nKey.TrendsBasedOnCompletedStatic)).toHaveLength(1);
  });

  test('measures the overall score diff from the baseline, so swapping the runs negates it', async () => {
    await renderLoaded({ primaryOverallScore: 0.265, comparedOverallScore: 0.812 });

    expect(card(RunsI18nKey.OverallScore).getByText('delta:0.547')).toBeInTheDocument();
  });

  test('explains the below-threshold glyph on hover of the second run score', async () => {
    const user = userEvent.setup();
    await renderLoaded({ primaryOverallScore: 0.812, comparedOverallScore: 0.265 });

    await user.hover(side(RunsI18nKey.OverallScore, 'Run #315').getByText('0.265'));

    expect((await screen.findByRole('tooltip')).textContent).toContain(
      TestSuitesI18nKey.TrendsOverallScoreBelowThresholdTooltip,
    );
  });

  test('describes each run’s own suite in its info tooltip', async () => {
    const user = userEvent.setup();
    await renderLoaded({
      primaryOverallScore: 0.812,
      comparedOverallScore: 0.265,
      primaryTestSuite: MEAN_SUITE,
      comparedTestSuite: {
        id: 'suite-2',
        overallScore: {
          type: OverallScoreType.WeightedMean,
          weights: [{ metricName: 'deepeval.context_prec', outputField: 'score', weight: 0.3 }],
        },
      },
    });

    await user.hover(
      side(RunsI18nKey.OverallScore, 'Run #315').getByRole('button', {
        name: TestSuitesI18nKey.OverallScoreCalculationMethod,
      }),
    );

    expect((await screen.findByRole('tooltip')).textContent).toContain(TestSuitesI18nKey.TrendsWeightedMeanOfNMetrics);
  });

  test('omits the overall score card when neither run has a score', async () => {
    await renderLoaded({ primaryOverallScore: null, comparedOverallScore: null });

    expect(screen.queryByRole('region', { name: RunsI18nKey.OverallScore })).not.toBeInTheDocument();
  });

  test('shows total runtime per run and marks a slower second run as the negative direction', async () => {
    await renderLoaded();

    expect(
      side(RunsI18nKey.TotalRuntime, 'Run #316').getByText(`241${SECONDS}`, { selector: 'span.dial-display2-text' }),
    ).toBeInTheDocument();
    expect(side(RunsI18nKey.TotalRuntime, 'Run #315').getAllByText(`351${SECONDS}`).length).toBeGreaterThan(0);
    expect(card(RunsI18nKey.TotalRuntime).getByText(`delta:110${SECONDS}`)).toBeInTheDocument();
    expect(card(RunsI18nKey.TotalRuntime).getByText('delta-negative')).toBeInTheDocument();
  });

  test('marks a runtime drop as the positive direction', async () => {
    await renderLoaded({ primaryRun: buildRun('run-2'), comparedRun: buildRun('run-1') });

    expect(card(RunsI18nKey.TotalRuntime).queryByText('delta-negative')).not.toBeInTheDocument();
  });

  test('shows total cost per run with its split and a dollar diff badge', async () => {
    await renderLoaded();

    const primaryCost = side(/Runs\.TotalRunCost/, 'Run #316');
    expect(await primaryCost.findByText('$120')).toBeInTheDocument();
    expect(primaryCost.getByText('$20')).toBeInTheDocument();
    const comparedCost = side(/Runs\.TotalRunCost/, 'Run #315');
    expect(await comparedCost.findByText('$110')).toBeInTheDocument();
    expect(comparedCost.getByText('$10')).toBeInTheDocument();
    expect(card(/Runs\.TotalRunCost/).getByText('-$10')).toBeInTheDocument();
  });

  test('dashes only the missing metrics cost of a run', async () => {
    getRunsTotalCostsMock.mockImplementation(([id]: string[]) =>
      Promise.resolve(id === 'run-2' ? costOf('run-2', 100, null) : COSTS_BY_RUN[id]),
    );
    await renderLoaded();

    const comparedCost = side(/Runs\.TotalRunCost/, 'Run #315');
    expect(await comparedCost.findAllByText('$100')).toHaveLength(2);
    expect(comparedCost.getByText('—')).toBeInTheDocument();
  });

  test('keeps one run’s cost visible while the other still calculates, without a diff badge', async () => {
    getRunsTotalCostsMock.mockImplementation(([id]: string[]) =>
      id === 'run-2' ? new Promise(() => undefined) : Promise.resolve(COSTS_BY_RUN[id]),
    );
    await renderLoaded();

    expect(await side(/Runs\.TotalRunCost/, 'Run #316').findByText('$120')).toBeInTheDocument();
    expect(side(/Runs\.TotalRunCost/, 'Run #315').getByRole('status')).toHaveTextContent(RunsI18nKey.Calculating);
    expect(card(/Runs\.TotalRunCost/).queryByText('-$10')).not.toBeInTheDocument();
  });

  test('shows an Error tag for the run whose cost request failed without blanking the other run', async () => {
    getRunsTotalCostsMock.mockImplementation(([id]: string[]) =>
      Promise.resolve(id === 'run-2' ? null : COSTS_BY_RUN[id]),
    );
    await renderLoaded();

    expect(await side(/Runs\.TotalRunCost/, 'Run #315').findByText(ErrorI18nKey.Error)).toBeInTheDocument();
    expect(side(/Runs\.TotalRunCost/, 'Run #316').getByText('$120')).toBeInTheDocument();
  });

  test('uses the matched-only slices for counts and runtime but still fetches whole-run cost', async () => {
    const matched = (passed: number, failed: number, error: number, runTime: number): RunAnalyticsSlice => ({
      statusCounts: { passed, failed, error, unscored: 0, total: passed + failed + error },
      totalRunTimeMs: runTime,
      totalMetricEvalDurationMs: null,
    });
    await renderLoaded({
      onlyMatchingTestCases: true,
      primaryMatchedAnalytics: matched(30, 10, 0, 100000),
      comparedMatchedAnalytics: matched(25, 10, 5, 80000),
    });

    expect(executeStructuredQueryMock).not.toHaveBeenCalled();
    expect(side(RunsI18nKey.TestCasesCompleted, 'Run #316').getByText('40')).toBeInTheDocument();
    expect(side(RunsI18nKey.TestCasesCompleted, 'Run #315').getByText('35')).toBeInTheDocument();
    expect(card(RunsI18nKey.TotalRuntime).getByText(`delta:-20${SECONDS}`)).toBeInTheDocument();
    expect(await side(/Runs\.TotalRunCost/, 'Run #316').findByText('$120')).toBeInTheDocument();
  });

  test('pins every divider to the value line so dividers line up across cards of different heights', async () => {
    await renderLoaded({ primaryOverallScore: 0.812, comparedOverallScore: 0.265 });

    for (const region of screen.getAllByRole('region')) {
      expect(region.className).toContain('[&_.w-px]:self-start');
      expect(region.className).toContain('[&_.w-px]:mt-[30px]');
    }
  });

  test('pushes the overall score footer to the bottom of the card, away from the values', async () => {
    await renderLoaded({ primaryOverallScore: 0.812, comparedOverallScore: 0.265 });

    expect(card(RunsI18nKey.OverallScore).getByText(TestSuitesI18nKey.TrendsBasedOnCompletedStatic)).toBeTruthy();
    expect(screen.getByRole('region', { name: RunsI18nKey.OverallScore }).className).toContain(
      '[&>span:last-child]:mt-auto',
    );
    expect(screen.getByRole('region', { name: RunsI18nKey.TotalRuntime }).className).not.toContain(
      '[&>span:last-child]:mt-auto',
    );
  });

  test('omits a diff badge when both runs have the same completed count', async () => {
    STATUS_BY_RUN['run-2'] = status(20, 25, 10);
    await renderLoaded();
    STATUS_BY_RUN['run-2'] = status(18, 24, 13);

    expect(card(RunsI18nKey.TestCasesCompleted).queryByText(/^delta:/)).not.toBeInTheDocument();
  });

  test('marks the data cards as Error when neither run has any results', async () => {
    executeStructuredQueryMock.mockResolvedValue({ rows: [] });
    getRunsTotalCostsMock.mockResolvedValue([]);
    renderAnalytics({
      primaryRun: buildRun('run-1', { completedAt: 1 }),
      comparedRun: buildRun('run-2', { completedAt: 1 }),
    });

    expect(await screen.findAllByText('error-tag')).toHaveLength(4);
  });
});
