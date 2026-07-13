import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import ResultArea from '@/src/components/Analytics/QueryBuilder/Result/ResultArea';
import { QueryMode, StructuredQueryResult } from '@/src/models/analytics/query';
import { ExecutedQueryMeta, QueryRequestKind } from '@/src/models/analytics/query-builder';

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData }: { rowData?: unknown[] }) => <div>grid rows: {rowData?.length ?? 0}</div>,
}));

const AGG_RESULT: StructuredQueryResult = {
  columns: ['deployment', 'total'],
  rows: [
    { deployment: 'gpt-4o', total: 120 },
    { deployment: 'claude', total: 80 },
  ],
  totalCount: 42,
};

const AGG_META: ExecutedQueryMeta = {
  kind: QueryRequestKind.Structured,
  mode: QueryMode.Aggregate,
  dimensionColumns: ['deployment'],
  aggregateColumns: ['total'],
};

const ROW_META: ExecutedQueryMeta = {
  kind: QueryRequestKind.Structured,
  mode: QueryMode.Row,
  dimensionColumns: [],
  aggregateColumns: [],
};

const renderArea = (overrides: Partial<Parameters<typeof ResultArea>[0]> = {}) => {
  const props = {
    result: null,
    meta: null,
    isRunning: false,
    ...overrides,
  };
  render(<ResultArea {...props} />);
  return props;
};

describe('QueryBuilder :: ResultArea', () => {
  test('shows the pre-run empty state', () => {
    renderArea();
    expect(screen.getByText('QueryBuilder.ResultsEmptyTitle')).toBeInTheDocument();
    expect(screen.getByText('QueryBuilder.ResultsEmptyDescription')).toBeInTheDocument();
  });

  test('renders stat tiles and the grid for a result', () => {
    renderArea({ result: AGG_RESULT, meta: AGG_META });

    expect(screen.getByText('QueryBuilder.RowsReturned')).toBeInTheDocument();
    expect(screen.getByText('QueryBuilder.Fields')).toBeInTheDocument();
    expect(screen.getByText('QueryBuilder.Total')).toBeInTheDocument();
    expect(screen.getByText('grid rows: 2')).toBeInTheDocument();
  });

  test('omits the Total tile when the response has no total', () => {
    renderArea({ result: { ...AGG_RESULT, totalCount: undefined }, meta: AGG_META });
    expect(screen.queryByText('QueryBuilder.Total')).not.toBeInTheDocument();
  });

  test('empty result shows the no-rows state', () => {
    renderArea({ result: { columns: [], rows: [] }, meta: ROW_META });
    expect(screen.getByText('QueryBuilder.NoRows')).toBeInTheDocument();
  });

  test('chart view renders chart controls for an aggregate result', async () => {
    const user = userEvent.setup();
    renderArea({ result: AGG_RESULT, meta: AGG_META });

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewChart' }));

    expect(screen.getByText(/QueryBuilder.ChartXAxis/)).toBeInTheDocument();
    expect(screen.getByText(/QueryBuilder.ChartYAxis/)).toBeInTheDocument();
  });

  test('chart view shows a hint for a grouped result with no aggregate columns', async () => {
    const user = userEvent.setup();
    renderArea({
      result: { columns: ['event_id', 'project_id'], rows: [{ event_id: '1', project_id: 'p' }] },
      meta: { ...AGG_META, dimensionColumns: ['event_id', 'project_id'], aggregateColumns: [] },
    });

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewChart' }));

    expect(screen.getByText('QueryBuilder.ChartUnavailable')).toBeInTheDocument();
  });

  test('chart view shows a hint for a row-mode result', async () => {
    const user = userEvent.setup();
    renderArea({ result: AGG_RESULT, meta: ROW_META });

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewChart' }));

    expect(screen.getByText('QueryBuilder.ChartUnavailable')).toBeInTheDocument();
  });
});
