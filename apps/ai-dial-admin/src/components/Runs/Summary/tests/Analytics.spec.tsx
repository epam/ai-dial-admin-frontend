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
    DialAnalyticsCard: ({ title, value, description, error }: any) => (
      <div role="region" aria-label={typeof title === 'string' ? title : undefined}>
        <div>{title}</div>
        <div>{value}</div>
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

const mockQueries = () => {
  executeStructuredQueryMock.mockImplementation((query: StructuredQuery) => {
    if (query.group_by) {
      return Promise.resolve(STATUS_ROWS);
    }
    const alias = query.select?.[0]?.as;
    if (alias === 'avg_duration_ms') {
      return Promise.resolve(AVG_ROWS);
    }
    return Promise.resolve({ rows: [] });
  });
};

describe('Runs Summary :: Analytics', () => {
  test('shows a loader until data resolves', async () => {
    mockQueries();
    render(<Analytics run={{ id: 'run-1' } as any} />);

    expect(screen.getByLabelText('loading-32')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Runs.TestCasesPassed')).toBeInTheDocument());
  });

  test('renders read-only overall score card when overall data is present', async () => {
    mockQueries();
    render(<Analytics run={{ id: 'run-1' } as any} overallScore={0.812} />);

    expect(await screen.findByText('Runs.OverallScore')).toBeInTheDocument();
    expect(screen.getByText('0.812')).toBeInTheDocument();
    expect(screen.getByText('Runs.OverallScoreDescription')).toBeInTheDocument();
  });

  test('hides overall score card when overall data is absent', async () => {
    mockQueries();
    render(<Analytics run={{ id: 'run-1' } as any} overallScore={null} />);

    await screen.findByText('Runs.TestCasesPassed');
    expect(screen.queryByText('Runs.OverallScore')).not.toBeInTheDocument();
  });

  test('hides overall score card while overall score is still loading', async () => {
    mockQueries();
    render(<Analytics run={{ id: 'run-1' } as any} />);

    await screen.findByText('Runs.TestCasesPassed');
    expect(screen.queryByText('Runs.OverallScore')).not.toBeInTheDocument();
  });

  test('renders passed test cases card with N/M value and status breakdown', async () => {
    mockQueries();
    render(<Analytics run={{ id: 'run-1' } as any} />);

    await screen.findByText('37/43');
    expect(screen.getByText('37 Runs.Pass')).toBeInTheDocument();
    expect(screen.getByText('4 Runs.Fail')).toBeInTheDocument();
    expect(screen.getByText('2 Runs.ExecError')).toBeInTheDocument();
  });

  test('renders average run time card in seconds', async () => {
    mockQueries();
    render(<Analytics run={{ id: 'run-1' } as any} />);

    expect(await screen.findByText('0.2 Runs.Seconds')).toBeInTheDocument();
  });

  test('marks cards as error when the run has no data', async () => {
    executeStructuredQueryMock.mockResolvedValue({ rows: [] });
    render(<Analytics run={{ id: 'run-1' } as any} overallScore={null} />);

    await waitFor(() => expect(screen.getAllByText('error-tag').length).toBeGreaterThanOrEqual(2));
  });
});
