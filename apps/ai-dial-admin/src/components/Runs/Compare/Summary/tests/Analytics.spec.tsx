import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { StructuredQuery } from '@/src/models/evaluation/structured-query';
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
    DialAnalyticsCard: ({ title, compareValues, delta, deltaPositive }: any) => (
      <div role="region" aria-label={typeof title === 'string' ? title : undefined}>
        <div>{title}</div>
        {delta != null && <span>delta:{delta}</span>}
        {deltaPositive === false && <span>delta-inverted</span>}
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

const mockQueries = () => {
  let statusCall = 0;
  let avgCall = 0;
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
    return Promise.resolve({ rows: [] });
  });
};

describe('Compare Summary :: Analytics', () => {
  test('shows a loader until both runs resolve', async () => {
    mockQueries();
    render(
      <Analytics primaryRunId="run-1" comparedRunId="run-2" primaryRunName="Run #316" comparedRunName="Run #315" />,
    );

    expect(screen.getByLabelText('loading-32')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Runs.TestCasesPassed')).toBeInTheDocument());
  });

  test('renders dual overall score with delta when scores are present', async () => {
    mockQueries();
    render(
      <Analytics
        primaryRunId="run-1"
        comparedRunId="run-2"
        primaryRunName="Run #316"
        comparedRunName="Run #315"
        primaryOverallScore={0.812}
        comparedOverallScore={0.265}
      />,
    );

    expect(await screen.findByText('Runs.OverallScore')).toBeInTheDocument();
    expect(screen.getByText('0.812')).toBeInTheDocument();
    expect(screen.getByText('0.265')).toBeInTheDocument();
    expect(screen.getByText('delta:-0.547')).toBeInTheDocument();
  });

  test('hides overall score when both sides are null', async () => {
    mockQueries();
    render(
      <Analytics
        primaryRunId="run-1"
        comparedRunId="run-2"
        primaryRunName="Run #316"
        comparedRunName="Run #315"
        primaryOverallScore={null}
        comparedOverallScore={null}
      />,
    );

    await screen.findByText('Runs.TestCasesPassed');
    expect(screen.queryByText('Runs.OverallScore')).not.toBeInTheDocument();
  });

  test('renders passed counts and runtime with inverted delta styling', async () => {
    mockQueries();
    render(
      <Analytics primaryRunId="run-1" comparedRunId="run-2" primaryRunName="Run #316" comparedRunName="Run #315" />,
    );

    await screen.findByText('Runs.AvgTestCaseRunTime');
    expect(screen.getByText('delta:-3')).toBeInTheDocument();
    expect(screen.getByText('delta:110')).toBeInTheDocument();
    expect(screen.getByText('delta-inverted')).toBeInTheDocument();
  });
});
