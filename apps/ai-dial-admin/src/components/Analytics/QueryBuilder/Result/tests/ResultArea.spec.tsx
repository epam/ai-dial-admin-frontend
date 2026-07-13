import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import ResultArea from '@/src/components/Analytics/QueryBuilder/Result/ResultArea';
import { StructuredQueryResult } from '@/src/models/analytics/query';

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData }: { rowData?: unknown[] }) => <div>grid rows: {rowData?.length ?? 0}</div>,
}));

const RESULT: StructuredQueryResult = {
  rows: [
    { deployment: 'gpt-4o', total: 120 },
    { deployment: 'claude', total: 80 },
  ],
  totalCount: 42,
};

const renderArea = (overrides: Partial<Parameters<typeof ResultArea>[0]> = {}) => {
  render(<ResultArea result={null} isRunning={false} {...overrides} />);
};

describe('QueryBuilder :: ResultArea', () => {
  test('shows the pre-run empty state', () => {
    renderArea();
    expect(screen.getByText('QueryBuilder.ResultsEmptyTitle')).toBeInTheDocument();
    expect(screen.getByText('QueryBuilder.ResultsEmptyDescription')).toBeInTheDocument();
  });

  test('renders stat chips and the grid for a result', () => {
    renderArea({ result: RESULT });

    expect(screen.getByText('QueryBuilder.Rows')).toBeInTheDocument();
    expect(screen.getByText('QueryBuilder.Total')).toBeInTheDocument();
    expect(screen.getByText('grid rows: 2')).toBeInTheDocument();
  });

  test('omits the Total chip when the response has no total', () => {
    renderArea({ result: { ...RESULT, totalCount: undefined } });
    expect(screen.queryByText('QueryBuilder.Total')).not.toBeInTheDocument();
  });

  test('empty result shows the no-rows state', () => {
    renderArea({ result: { rows: [] } });
    expect(screen.getByText('QueryBuilder.NoRows')).toBeInTheDocument();
  });
});
