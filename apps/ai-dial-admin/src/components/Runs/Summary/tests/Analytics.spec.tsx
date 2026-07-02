import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { StructuredQuery } from '@/src/models/evaluation/structured-query';
import { MetricOption } from '../models';
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
    DialSelect: ({ options, value, onChange, disabled }: any) => (
      <select
        aria-label="metric-select"
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
    ),
    DialAnalyticsCard: ({ title, value, description, error, isLoading }: any) => (
      <div role="region" aria-label={typeof title === 'string' ? title : undefined}>
        <div>{title}</div>
        <div>{value}</div>
        <div>{description}</div>
        {isLoading && <span>loading-card</span>}
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
const METRIC_OPTIONS: MetricOption[] = [
  { name: 'Ragas Answer Relevancy.score', field: 'metric::Ragas Answer Relevancy::score', computationId: 'comp-1' },
  { name: 'Exact Match.exact_match', field: 'metric::Exact Match::exact_match', computationId: 'comp-1' },
];

const metricFieldOf = (query: StructuredQuery): string | undefined => {
  const arg = (query.select?.[0]?.expr as any)?.args?.[0];
  return arg?.name;
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
    if (alias === 'value') {
      return Promise.resolve({ rows: [{ value: metricFieldOf(query)?.includes('Ragas') ? 0.85 : 0.42 }] });
    }
    return Promise.resolve({ rows: [] });
  });
};

describe('Runs Summary :: Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('shows a loader until data resolves', async () => {
    mockQueries();
    render(<Analytics run={{ id: 'run-1' } as any} metricOptions={METRIC_OPTIONS} />);

    expect(screen.getByLabelText('loading-32')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Runs.TestCasesPassed')).toBeInTheDocument());
  });

  test('renders overall score card with the metric dropdown in its description', async () => {
    mockQueries();
    render(<Analytics run={{ id: 'run-1' } as any} metricOptions={METRIC_OPTIONS} />);

    expect(await screen.findByText('Runs.OverallScore')).toBeInTheDocument();
    expect(screen.getByText('Runs.AvgFor')).toBeInTheDocument();

    const select = screen.getByLabelText('metric-select');
    expect(select.querySelector('option[value="Ragas Answer Relevancy.score"]')).toBeInTheDocument();
    expect(select.querySelector('option[value="Exact Match.exact_match"]')).toBeInTheDocument();
  });

  test('selects no metric by default and does not query an overall score', async () => {
    mockQueries();
    render(<Analytics run={{ id: 'run-1' } as any} metricOptions={METRIC_OPTIONS} />);

    await screen.findByText('Runs.OverallScore');

    const issuedValueQuery = executeStructuredQueryMock.mock.calls.some(
      ([query]) => (query as StructuredQuery).select?.[0]?.as === 'value',
    );
    expect(issuedValueQuery).toBe(false);
  });

  test('queries the overall score with the selected metric field', async () => {
    mockQueries();
    render(<Analytics run={{ id: 'run-1' } as any} metricOptions={METRIC_OPTIONS} />);

    await screen.findByText('Runs.OverallScore');

    fireEvent.change(screen.getByLabelText('metric-select'), { target: { value: 'Ragas Answer Relevancy.score' } });
    await waitFor(() => expect(screen.getByText('0.85')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText('metric-select'), { target: { value: 'Exact Match.exact_match' } });
    await waitFor(() => expect(screen.getByText('0.42')).toBeInTheDocument());

    const lastValueQuery = executeStructuredQueryMock.mock.calls
      .map(([query]) => query as StructuredQuery)
      .reverse()
      .find((query) => query.select?.[0]?.as === 'value');
    expect(metricFieldOf(lastValueQuery!)).toBe('metric::Exact Match::exact_match');
  });

  test('shows a loader on the overall score card while the metric query is in flight', async () => {
    executeStructuredQueryMock.mockImplementation((query: StructuredQuery) => {
      if (query.group_by) {
        return Promise.resolve(STATUS_ROWS);
      }
      const alias = query.select?.[0]?.as;
      if (alias === 'avg_duration_ms') {
        return Promise.resolve(AVG_ROWS);
      }
      if (alias === 'value') {
        return new Promise(() => {}); // never resolves → stays loading
      }
      return Promise.resolve({ rows: [] });
    });

    render(<Analytics run={{ id: 'run-1' } as any} metricOptions={METRIC_OPTIONS} />);

    await screen.findByText('Runs.OverallScore');
    fireEvent.change(screen.getByLabelText('metric-select'), { target: { value: 'Ragas Answer Relevancy.score' } });

    const card = screen.getByRole('region', { name: 'Runs.OverallScore' });
    await waitFor(() => expect(within(card).getByText('loading-card')).toBeInTheDocument());
  });

  test('renders passed test cases card with N/M value and status breakdown', async () => {
    mockQueries();
    render(<Analytics run={{ id: 'run-1' } as any} metricOptions={METRIC_OPTIONS} />);

    await screen.findByText('37/43');
    expect(screen.getByText('37 Runs.Pass')).toBeInTheDocument();
    expect(screen.getByText('4 Runs.Fail')).toBeInTheDocument();
    expect(screen.getByText('2 Runs.ExecError')).toBeInTheDocument();
  });

  test('renders average run time card in milliseconds', async () => {
    mockQueries();
    render(<Analytics run={{ id: 'run-1' } as any} metricOptions={METRIC_OPTIONS} />);

    expect(await screen.findByText('200 Runs.Milliseconds')).toBeInTheDocument();
  });

  test('marks cards as error when the run has no data', async () => {
    executeStructuredQueryMock.mockResolvedValue({ rows: [] });
    render(<Analytics run={{ id: 'run-1' } as any} metricOptions={[]} />);

    await waitFor(() => expect(screen.getAllByText('error-tag').length).toBeGreaterThanOrEqual(3));
  });
});
