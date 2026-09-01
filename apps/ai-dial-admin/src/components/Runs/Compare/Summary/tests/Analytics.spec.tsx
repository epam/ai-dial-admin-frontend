import { render, screen, waitFor } from '@testing-library/react';
import { ComponentProps } from 'react';
import { describe, expect, test, vi } from 'vitest';

import { StructuredQuery } from '@/src/models/evaluation/structured-query';
import { RunAnalyticsSlice } from '@/src/components/Runs/Summary/models';
import Analytics from '../Analytics';

const executeStructuredQueryMock = vi.fn();

vi.mock('@/src/app/[lang]/runs/actions', () => ({
  executeStructuredQuery: (query: StructuredQuery) => executeStructuredQueryMock(query),
}));

vi.mock('@epam/ai-dial-ui-kit', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    DialLoader: ({ size }: any) => <div aria-label={`loading-${size}`} />,
    DialAnalyticsCard: ({ title, compareValues, delta, deltaPositive, deltaUnit }: any) => (
      <div role="region" aria-label={typeof title === 'string' ? title : undefined}>
        <div>{title}</div>
        {delta != null && <span>delta:{delta}</span>}
        {deltaPositive === false && <span>delta-inverted</span>}
        {deltaUnit != null && <span>delta-unit:{deltaUnit}</span>}
        {(compareValues || []).map((item: any, index: number) => (
          <div key={index}>
            <span>{item.title}</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>
    ),
  };
});

const STATUS_ROWS = {
  rows: [
    { execution_status: 'SUCCESS', count: 48 },
    { execution_status: 'FAILED', count: 2 },
  ],
};
const COMPARED_STATUS_ROWS = {
  rows: [
    { execution_status: 'SUCCESS', count: 45 },
    { execution_status: 'FAILED', count: 0 },
  ],
};
const AVG_ROWS = { rows: [{ avg_duration_ms: 241000 }] };
const COMPARED_AVG_ROWS = { rows: [{ avg_duration_ms: 351000 }] };
const AVG_METRIC_EVAL_ROWS = { rows: [{ avg_metric_eval_duration_ms: 291123.6 }] };
const COMPARED_AVG_METRIC_EVAL_ROWS = { rows: [{ avg_metric_eval_duration_ms: 120456.4 }] };

const MATCHED_PRIMARY: RunAnalyticsSlice = {
  statusCounts: { passed: 338, failed: 8, error: 4, total: 350 },
  avgRunTimeMs: 1240.5,
  avgMetricEvalDurationMs: 291123.6,
};
const MATCHED_COMPARED: RunAnalyticsSlice = {
  statusCounts: { passed: 320, failed: 20, error: 10, total: 350 },
  avgRunTimeMs: 1500,
  avgMetricEvalDurationMs: 120456.4,
};

const mockQueries = () => {
  let statusCall = 0;
  let avgCall = 0;
  let avgMetricEvalCall = 0;
  executeStructuredQueryMock.mockImplementation((query: StructuredQuery) => {
    if (query.group_by) {
      statusCall += 1;
      return Promise.resolve(statusCall === 1 ? STATUS_ROWS : COMPARED_STATUS_ROWS);
    }
    const alias = query.select?.[0]?.as;
    if (alias === 'avg_duration_ms') {
      avgCall += 1;
      return Promise.resolve(avgCall === 1 ? AVG_ROWS : COMPARED_AVG_ROWS);
    }
    if (alias === 'avg_metric_eval_duration_ms') {
      avgMetricEvalCall += 1;
      return Promise.resolve(avgMetricEvalCall === 1 ? AVG_METRIC_EVAL_ROWS : COMPARED_AVG_METRIC_EVAL_ROWS);
    }
    return Promise.resolve({ rows: [] });
  });
};

const renderAnalytics = (overrides: Partial<ComponentProps<typeof Analytics>> = {}) =>
  render(
    <Analytics
      primaryRunId="run-1"
      comparedRunId="run-2"
      primaryRunName="Run #316"
      comparedRunName="Run #315"
      onlyMatchingTestCases={false}
      primaryMatchedAnalytics={null}
      comparedMatchedAnalytics={null}
      {...overrides}
    />,
  );

describe('Compare Summary :: Analytics', () => {
  test('shows a loader until both runs resolve', async () => {
    mockQueries();
    renderAnalytics();

    expect(screen.getByLabelText('loading-32')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Runs.TestCasesPassed')).toBeInTheDocument());
  });

  test('renders dual overall score with delta when scores are present', async () => {
    mockQueries();
    renderAnalytics({ primaryOverallScore: 0.812, comparedOverallScore: 0.265 });

    expect(await screen.findByText('Runs.OverallScore')).toBeInTheDocument();
    expect(screen.getByText('0.812')).toBeInTheDocument();
    expect(screen.getByText('0.265')).toBeInTheDocument();
    expect(screen.getByText('delta:-0.547')).toBeInTheDocument();
  });

  test('hides overall score when both sides are null', async () => {
    mockQueries();
    renderAnalytics({ primaryOverallScore: null, comparedOverallScore: null });

    await screen.findByText('Runs.TestCasesPassed');
    expect(screen.queryByText('Runs.OverallScore')).not.toBeInTheDocument();
  });

  test('renders passed counts, runtime, and metric-eval latency with seconds delta units', async () => {
    mockQueries();
    renderAnalytics();

    expect(await screen.findByText('Runs.AvgTestCaseRunTime')).toBeInTheDocument();
    expect(screen.getByText('Runs.AvgMetricEvalLatency')).toBeInTheDocument();
    expect(screen.getByText('delta:-3')).toBeInTheDocument();
    expect(screen.getByText('delta:110')).toBeInTheDocument();
    expect(screen.getByText('delta:-170.6')).toBeInTheDocument();
    expect(screen.getAllByText('delta-inverted')).toHaveLength(1);
    expect(screen.getAllByText('delta-unit:Runs.Seconds')).toHaveLength(2);
  });

  test('shows status breakdown and uses matched analytics when onlyMatchingTestCases is on', async () => {
    executeStructuredQueryMock.mockClear();
    renderAnalytics({
      onlyMatchingTestCases: true,
      primaryMatchedAnalytics: MATCHED_PRIMARY,
      comparedMatchedAnalytics: MATCHED_COMPARED,
    });

    await screen.findByText('Runs.TestCasesPassed');
    expect(screen.getAllByText('338').length).toBeGreaterThan(0);
    expect(screen.getAllByText('/ 350')).toHaveLength(2);
    expect(screen.getAllByText('Runs.Pass')).toHaveLength(2);
    expect(screen.getAllByText('Runs.Fail')).toHaveLength(2);
    expect(screen.getAllByText('Runs.ExecError')).toHaveLength(2);
    expect(screen.getByText('Runs.AvgMetricEvalLatency')).toBeInTheDocument();
    expect(screen.getByText('delta:-170.6')).toBeInTheDocument();
    expect(executeStructuredQueryMock).not.toHaveBeenCalled();
  });
});
