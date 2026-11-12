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
  columnValueClasses: {},
};

const renderChart = (config: ChartConfig = DEFAULT_CHART_CONFIG, result = RESULT, meta = META) => {
  const onChangeConfig = vi.fn();
  render(<ResultChart result={result} meta={meta} config={config} onChangeConfig={onChangeConfig} />);
  return onChangeConfig;
};

describe('QueryBuilder :: ResultChart', () => {
  test('bar labels the selectors as axes with dimension/aggregate defaults', () => {
    renderChart();
    expect(screen.getByRole('combobox', { name: 'QueryBuilder.ChartXAxis' })).toHaveDisplayValue(/Deployment/);
    expect(screen.getByRole('combobox', { name: 'QueryBuilder.ChartYAxis, total' })).toBeInTheDocument();
  });

  test('dimension columns display by their schema display name, aggregates by their alias', () => {
    renderChart();
    expect(screen.getByRole('combobox', { name: 'QueryBuilder.ChartXAxis' })).not.toHaveDisplayValue(/\sdeployment$/);
    expect(screen.getByRole('combobox', { name: 'QueryBuilder.ChartXAxis' })).toHaveDisplayValue(/Deployment/);
  });

  test('pie relabels the selectors as Category and Value', () => {
    renderChart({ type: ChartType.Pie, xField: null, yFields: null });
    expect(screen.getByRole('combobox', { name: 'QueryBuilder.ChartCategory' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'QueryBuilder.ChartValue' })).toBeInTheDocument();
  });

  test('draws the pie as a donut with its total, the top 10 categories and the rest as Other', () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({ deployment: `m${index}`, total: 12 - index, tokens: 1 }));
    renderChart({ type: ChartType.Pie, xField: 'deployment', yFields: ['total'] }, { columns: RESULT.columns, rows });

    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText('total')).toBeInTheDocument();
    expect(screen.getByText('m9')).toBeInTheDocument();
    expect(screen.queryByText('m10')).toBeNull();
    expect(screen.getByText('QueryBuilder.ChartOtherSlice')).toBeInTheDocument();
  });

  test('scatter defaults its two axes to distinct numeric columns', () => {
    renderChart({ type: ChartType.Scatter, xField: null, yFields: null });
    expect(screen.getByRole('combobox', { name: 'QueryBuilder.ChartXAxis' })).toHaveDisplayValue(/total/);
    expect(screen.getByRole('combobox', { name: 'QueryBuilder.ChartYAxis' })).toHaveDisplayValue(/tokens/);
  });

  test('switching to a compatible type keeps the column picks', async () => {
    const user = userEvent.setup();
    const onChangeConfig = renderChart({ type: ChartType.Bar, xField: 'deployment', yFields: ['total'] });

    await user.click(screen.getByRole('radio', { name: 'Pie' }));

    expect(onChangeConfig).toHaveBeenCalledWith({ type: ChartType.Pie, xField: 'deployment', yFields: ['total'] });
  });

  test('switching type drops a pick the new slot cannot hold', async () => {
    const user = userEvent.setup();
    const onChangeConfig = renderChart({ type: ChartType.Bar, xField: 'deployment', yFields: ['total'] });

    await user.click(screen.getByRole('radio', { name: 'Scatter' }));

    expect(onChangeConfig).toHaveBeenCalledWith({ type: ChartType.Scatter, xField: null, yFields: ['total'] });
  });

  test('scatter is hidden when the result has fewer than two numeric columns', () => {
    const result: StructuredQueryResult = {
      columns: ['deployment', 'total'],
      rows: [{ deployment: 'gpt-4o', total: 120 }],
    };
    const meta: ExecutedQueryMeta = { ...META, aggregateColumns: ['total'] };
    renderChart(DEFAULT_CHART_CONFIG, result, meta);

    expect(screen.queryByRole('radio', { name: 'Scatter' })).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Pie' })).toBeInTheDocument();
  });

  // A fallback-classified SQL run puts its numeric columns in BOTH lists; counting them twice would
  // offer scatter one column to plot against itself.
  test('scatter stays hidden when a fallback meta repeats its only numeric column in both lists', () => {
    const result: StructuredQueryResult = {
      columns: ['deployment', 'total'],
      rows: [
        { deployment: 'gpt-4o', total: 120 },
        { deployment: 'claude', total: 80 },
      ],
    };
    renderChart(DEFAULT_CHART_CONFIG, result, {
      ...META,
      kind: QueryRequestKind.Sql,
      mode: QueryMode.Row,
      dimensionColumns: ['deployment', 'total'],
      aggregateColumns: ['total'],
    });

    expect(screen.queryByRole('radio', { name: 'Scatter' })).not.toBeInTheDocument();
  });

  test('names the missing axis pick when a slot has no column to default to', () => {
    const result: StructuredQueryResult = {
      columns: ['deployment', 'total'],
      rows: [{ deployment: 'gpt-4o', total: 120 }],
    };
    renderChart({ type: ChartType.Scatter, xField: null, yFields: null }, result, {
      ...META,
      dimensionColumns: [],
      aggregateColumns: [],
    });

    expect(screen.getByText('QueryBuilder.ChartNoAxisSelection')).toBeInTheDocument();
  });

  describe('several Y columns', () => {
    test('restores a stored multi-column pick as one tag per column', () => {
      renderChart({ type: ChartType.Line, xField: 'deployment', yFields: ['tokens', 'total'] });
      expect(screen.getByRole('button', { name: 'Remove tokens' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove total' })).toBeInTheDocument();
    });

    test('adds a second column to the Y picks', async () => {
      const user = userEvent.setup();
      const onChangeConfig = renderChart({ type: ChartType.Bar, xField: 'deployment', yFields: ['total'] });

      await user.click(screen.getByRole('combobox', { name: /QueryBuilder.ChartYAxis/ }));
      await user.click(await screen.findByRole('option', { name: /tokens/ }));

      expect(onChangeConfig).toHaveBeenCalledWith({
        type: ChartType.Bar,
        xField: 'deployment',
        yFields: ['total', 'tokens'],
      });
    });

    test('removes a column from the Y picks', async () => {
      const user = userEvent.setup();
      const onChangeConfig = renderChart({ type: ChartType.Line, xField: 'deployment', yFields: ['total', 'tokens'] });

      await user.click(screen.getByRole('button', { name: 'Remove total' }));

      expect(onChangeConfig).toHaveBeenCalledWith({ type: ChartType.Line, xField: 'deployment', yFields: ['tokens'] });
    });

    test('keeps the selectors and names the missing pick when every Y column is removed', () => {
      renderChart({ type: ChartType.Bar, xField: 'deployment', yFields: [] });
      expect(screen.getByText('QueryBuilder.ChartNoAxisSelection')).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /QueryBuilder.ChartYAxis/ })).toBeInTheDocument();
    });

    test('switching to pie keeps only the first Y column', async () => {
      const user = userEvent.setup();
      const onChangeConfig = renderChart({ type: ChartType.Line, xField: 'deployment', yFields: ['tokens', 'total'] });

      await user.click(screen.getByRole('radio', { name: 'Pie' }));

      expect(onChangeConfig).toHaveBeenCalledWith({ type: ChartType.Pie, xField: 'deployment', yFields: ['tokens'] });
    });

    test('ignores a stored column the result no longer returns', () => {
      renderChart({ type: ChartType.Line, xField: 'deployment', yFields: ['gone', 'total'] });
      expect(screen.queryByRole('button', { name: 'Remove gone' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove total' })).toBeInTheDocument();
    });
  });
});
