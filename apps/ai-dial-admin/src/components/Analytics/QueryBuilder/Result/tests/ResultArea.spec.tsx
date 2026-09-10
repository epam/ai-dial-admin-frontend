import { FC, useState } from 'react';

import { ColDef, ValueFormatterParams } from 'ag-grid-community';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import ResultArea from '@/src/components/Analytics/QueryBuilder/Result/ResultArea';
import { DEFAULT_CHART_CONFIG } from '@/src/constants/analytics/query-builder';
import { QueryMode, StructuredQueryResult } from '@/src/models/analytics/query';
import {
  ChartConfig,
  ExecutedQueryMeta,
  QueryRequestKind,
  QueryResultView,
  ResultValueClass,
} from '@/src/models/analytics/query-builder';

// Captures the columnDefs GridView receives on each render, so a test can call a column's own
// valueFormatter directly and prove the fragment from getValueClassColumn reached the grid.
const { capturedColumnDefs } = vi.hoisted(() => ({ capturedColumnDefs: { current: [] as ColDef[] } }));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData, columnDefs }: { rowData?: unknown[]; columnDefs?: ColDef[] }) => {
    capturedColumnDefs.current = columnDefs ?? [];
    return <div>grid rows: {rowData?.length ?? 0}</div>;
  },
}));

const formatWith = (col: ColDef | undefined, value: unknown): string =>
  (col?.valueFormatter as (p: ValueFormatterParams) => string)({ value } as ValueFormatterParams);

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
  columnLabels: {},
  columnValueClasses: { total: ResultValueClass.Compact },
};

const ROW_META: ExecutedQueryMeta = {
  kind: QueryRequestKind.Structured,
  mode: QueryMode.Row,
  dimensionColumns: [],
  aggregateColumns: [],
  columnLabels: {},
  columnValueClasses: {},
};

const SQL_TRANSLATED_META: ExecutedQueryMeta = {
  kind: QueryRequestKind.Sql,
  mode: QueryMode.Aggregate,
  dimensionColumns: ['deployment'],
  aggregateColumns: ['total'],
  columnLabels: {},
  columnValueClasses: {},
};

const SQL_FALLBACK_META: ExecutedQueryMeta = {
  kind: QueryRequestKind.Sql,
  mode: QueryMode.Row,
  dimensionColumns: ['event_id', 'project_id'],
  aggregateColumns: [],
  columnLabels: {},
  columnValueClasses: {},
};

type AreaProps = Parameters<typeof ResultArea>[0];

// ResultArea is controlled by the orchestrator, so the view and chart config live above it. This
// harness supplies that state locally, keeping the switcher interactive in tests that click it.
const ControlledArea: FC<Omit<AreaProps, 'view' | 'onChangeView' | 'chartConfig' | 'onChangeChartConfig'>> = (
  props,
) => {
  const [view, setView] = useState(QueryResultView.Table);
  const [chartConfig, setChartConfig] = useState<ChartConfig>(DEFAULT_CHART_CONFIG);

  return (
    <ResultArea
      {...props}
      view={view}
      onChangeView={setView}
      chartConfig={chartConfig}
      onChangeChartConfig={setChartConfig}
    />
  );
};

const renderArea = (overrides: Partial<AreaProps> = {}) => {
  const props = {
    result: null,
    meta: null,
    isRunning: false,
    ...overrides,
  };
  render(<ControlledArea {...props} />);
  return props;
};

describe('QueryBuilder :: ResultArea', () => {
  test('shows the pre-run empty state', () => {
    renderArea();
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

    expect(screen.getByText('QueryBuilder.ChartNoValueColumn')).toBeInTheDocument();
  });

  test('chart view shows a hint for a row-mode result', async () => {
    const user = userEvent.setup();
    renderArea({ result: AGG_RESULT, meta: ROW_META });

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewChart' }));

    expect(screen.getByText('QueryBuilder.ChartNoDimension')).toBeInTheDocument();
  });

  test('chart view renders chart controls for a translated SQL result', async () => {
    const user = userEvent.setup();
    renderArea({ result: AGG_RESULT, meta: SQL_TRANSLATED_META });

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewChart' }));

    expect(screen.getByText(/QueryBuilder.ChartXAxis/)).toBeInTheDocument();
    expect(screen.getByText(/QueryBuilder.ChartYAxis/)).toBeInTheDocument();
  });

  test('chart view shows the no-value-column hint for a fallback SQL result', async () => {
    const user = userEvent.setup();
    renderArea({
      result: { columns: ['event_id', 'project_id'], rows: [{ event_id: '1', project_id: 'p' }] },
      meta: SQL_FALLBACK_META,
    });

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewChart' }));

    expect(screen.getByText('QueryBuilder.ChartNoValueColumn')).toBeInTheDocument();
    expect(screen.queryByText('QueryBuilder.ChartNoDimension')).not.toBeInTheDocument();
  });

  test('chart view shows the no-rows hint for an empty result', async () => {
    const user = userEvent.setup();
    renderArea({ result: { columns: [], rows: [] }, meta: AGG_META });

    await user.click(screen.getByRole('tab', { name: 'QueryBuilder.ViewChart' }));

    expect(screen.getByText('QueryBuilder.ChartNoRows')).toBeInTheDocument();
  });

  test('formats a classified column while an unclassified column in the same result renders as today', () => {
    renderArea({ result: AGG_RESULT, meta: AGG_META });

    const totalColumn = capturedColumnDefs.current.find((col) => col.field === 'total');
    const deploymentColumn = capturedColumnDefs.current.find((col) => col.field === 'deployment');

    expect(formatWith(totalColumn, 4897666958)).toBe('4.9 B');
    expect(formatWith(deploymentColumn, 'gpt-4o')).toBe('gpt-4o');
  });

  test('reformats a column once a re-render classifies it, proving columnValueClasses re-triggers the memo', () => {
    const { rerender } = render(
      <ControlledArea result={AGG_RESULT} meta={{ ...AGG_META, columnValueClasses: {} }} isRunning={false} />,
    );

    const initialTotalColumn = capturedColumnDefs.current.find((col) => col.field === 'total');
    expect(formatWith(initialTotalColumn, 4897666958)).toBe('4897666958');

    rerender(
      <ControlledArea
        result={AGG_RESULT}
        meta={{ ...AGG_META, columnValueClasses: { total: ResultValueClass.Compact } }}
        isRunning={false}
      />,
    );

    const updatedTotalColumn = capturedColumnDefs.current.find((col) => col.field === 'total');
    expect(formatWith(updatedTotalColumn, 4897666958)).toBe('4.9 B');
  });
});
