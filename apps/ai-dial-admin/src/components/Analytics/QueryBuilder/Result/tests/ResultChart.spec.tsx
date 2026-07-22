import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import ResultChart from '@/src/components/Analytics/QueryBuilder/Result/ResultChart';
import { DEFAULT_CHART_CONFIG } from '@/src/constants/analytics/query-builder';
import { QueryMode, StructuredQueryResult } from '@/src/models/analytics/query';
import { ChartConfig, ChartType, ExecutedQueryMeta, QueryRequestKind } from '@/src/models/analytics/query-builder';

const RESULT: StructuredQueryResult = {
  columns: ['deployment', 'total', 'tokens'],
  rows: [
    { deployment: 'gpt-4o', total: 120, tokens: 900 },
    { deployment: 'claude', total: 80, tokens: 400 },
  ],
};

const META: ExecutedQueryMeta = {
  kind: QueryRequestKind.Structured,
  mode: QueryMode.Aggregate,
  dimensionColumns: ['deployment'],
  aggregateColumns: ['total', 'tokens'],
  columnLabels: { deployment: 'Deployment' },
};

const renderChart = (config: ChartConfig = DEFAULT_CHART_CONFIG, result = RESULT, meta = META) => {
  const onChangeConfig = vi.fn();
  render(<ResultChart result={result} meta={meta} config={config} onChangeConfig={onChangeConfig} />);
  return onChangeConfig;
};

describe('QueryBuilder :: ResultChart', () => {
  test('bar labels the selectors as axes with dimension/aggregate defaults', () => {
    renderChart();
    expect(screen.getByText(/QueryBuilder.ChartXAxis:\s+Deployment/)).toBeInTheDocument();
    expect(screen.getByText(/QueryBuilder.ChartYAxis:\s+total/)).toBeInTheDocument();
  });

  test('dimension columns display by their schema display name, aggregates by their alias', () => {
    renderChart();
    expect(screen.queryByText(/QueryBuilder.ChartXAxis:\s+deployment/)).not.toBeInTheDocument();
    expect(screen.getByText(/QueryBuilder.ChartXAxis:\s+Deployment/)).toBeInTheDocument();
  });

  test('pie relabels the selectors as Category and Value', () => {
    renderChart({ type: ChartType.Pie, xField: null, yField: null });
    expect(screen.getByText(/QueryBuilder.ChartCategory/)).toBeInTheDocument();
    expect(screen.getByText(/QueryBuilder.ChartValue/)).toBeInTheDocument();
  });

  test('scatter defaults its two axes to distinct numeric columns', () => {
    renderChart({ type: ChartType.Scatter, xField: null, yField: null });
    expect(screen.getByText(/QueryBuilder.ChartXAxis:\s+total/)).toBeInTheDocument();
    expect(screen.getByText(/QueryBuilder.ChartYAxis:\s+tokens/)).toBeInTheDocument();
  });

  test('switching to a compatible type keeps the column picks', async () => {
    const user = userEvent.setup();
    const onChangeConfig = renderChart({ type: ChartType.Bar, xField: 'deployment', yField: 'total' });

    await user.click(screen.getByRole('tab', { name: 'Pie' }));

    expect(onChangeConfig).toHaveBeenCalledWith({ type: ChartType.Pie, xField: 'deployment', yField: 'total' });
  });

  test('switching type drops a pick the new slot cannot hold', async () => {
    const user = userEvent.setup();
    const onChangeConfig = renderChart({ type: ChartType.Bar, xField: 'deployment', yField: 'total' });

    await user.click(screen.getByRole('tab', { name: 'Scatter' }));

    expect(onChangeConfig).toHaveBeenCalledWith({ type: ChartType.Scatter, xField: null, yField: 'total' });
  });

  test('scatter is hidden when the result has fewer than two numeric columns', () => {
    const result: StructuredQueryResult = {
      columns: ['deployment', 'total'],
      rows: [{ deployment: 'gpt-4o', total: 120 }],
    };
    const meta: ExecutedQueryMeta = { ...META, aggregateColumns: ['total'] };
    renderChart(DEFAULT_CHART_CONFIG, result, meta);

    expect(screen.queryByRole('tab', { name: 'Scatter' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Pie' })).toBeInTheDocument();
  });
});
