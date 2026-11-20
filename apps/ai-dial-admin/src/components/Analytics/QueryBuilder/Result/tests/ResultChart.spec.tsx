import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ResultChart from '@/src/components/Analytics/QueryBuilder/Result/ResultChart';
import { DEFAULT_CHART_CONFIG } from '@/src/constants/analytics/query-builder';
import { QueryMode, StructuredQueryResult } from '@/src/models/analytics/query';
import {
  ChartConfig,
  ChartLegendPosition,
  ChartType,
  ExecutedQueryMeta,
  QueryRequestKind,
} from '@/src/models/analytics/query-builder';

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

const typeSelect = () => screen.getByRole('combobox', { name: /^QueryBuilder.ChartTypeSwitcher/ });

const pickType = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(typeSelect());
  await user.click(await screen.findByRole('option', { name }));
};

const offeredTypes = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(typeSelect());
  return (await screen.findAllByRole('option')).map((option) => option.textContent);
};

describe('QueryBuilder :: ResultChart', () => {
  test('bar labels the selectors as axes with dimension/aggregate defaults', () => {
    renderChart();
    expect(screen.getByRole('combobox', { name: /^QueryBuilder.ChartXAxis/ })).toHaveAccessibleName(
      /QueryBuilder.ChartXAxis.*Deployment/,
    );
    expect(screen.getByRole('combobox', { name: 'QueryBuilder.ChartYAxis, total' })).toBeInTheDocument();
  });

  test('offers several Y columns as tags and a single one as a plain select', () => {
    renderChart({ ...DEFAULT_CHART_CONFIG, xField: 'deployment', yFields: ['total'] });
    expect(screen.getByRole('button', { name: 'Remove total' })).toBeInTheDocument();
  });

  test('draws the Y selector as a plain select when one column is available', () => {
    renderChart({ ...DEFAULT_CHART_CONFIG, xField: 'deployment', yFields: ['total'] }, RESULT, {
      ...META,
      aggregateColumns: ['total'],
    });

    expect(screen.getByRole('combobox', { name: 'QueryBuilder.ChartYAxis, total' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove total' })).toBeNull();
  });

  test('dimension columns display by their schema display name, aggregates by their alias', () => {
    renderChart();
    const xAxis = screen.getByRole('combobox', { name: /^QueryBuilder.ChartXAxis/ });
    expect(xAxis).toHaveAccessibleName(/Deployment/);
    expect(xAxis).not.toHaveAccessibleName(/\sdeployment$/);
  });

  test('pie relabels the selectors as Slices and Value', () => {
    renderChart({ type: ChartType.Pie, xField: null, yFields: null });
    expect(screen.getByRole('combobox', { name: /^QueryBuilder.ChartSlices/ })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /^QueryBuilder.ChartValue/ })).toBeInTheDocument();
  });

  test('legends the pie with the top 10 categories and the rest as Other', () => {
    const rows = Array.from({ length: 12 }, (_, index) => ({ deployment: `m${index}`, total: 12 - index, tokens: 1 }));
    renderChart({ type: ChartType.Pie, xField: 'deployment', yFields: ['total'] }, { columns: RESULT.columns, rows });

    expect(screen.queryByText('78')).toBeNull();
    expect(screen.getByText('m9')).toBeInTheDocument();
    expect(screen.queryByText('m10')).toBeNull();
    expect(screen.getByText('QueryBuilder.ChartOtherSlice')).toBeInTheDocument();
  });

  test('scatter defaults its two axes to distinct numeric columns', () => {
    renderChart({ type: ChartType.Scatter, xField: null, yFields: null });
    expect(screen.getByRole('combobox', { name: /^QueryBuilder.ChartXAxis/ })).toHaveAccessibleName(/total/);
    expect(screen.getByRole('combobox', { name: /^QueryBuilder.ChartYAxis/ })).toHaveAccessibleName(/tokens/);
  });

  test('switching to a compatible type keeps the column picks', async () => {
    const user = userEvent.setup();
    const onChangeConfig = renderChart({ type: ChartType.Bar, xField: 'deployment', yFields: ['total'] });

    await pickType(user, 'Pie');

    expect(onChangeConfig).toHaveBeenCalledWith({ type: ChartType.Pie, xField: 'deployment', yFields: ['total'] });
  });

  test('switching type drops a pick the new slot cannot hold', async () => {
    const user = userEvent.setup();
    const onChangeConfig = renderChart({ type: ChartType.Bar, xField: 'deployment', yFields: ['total'] });

    await pickType(user, 'Scatter');

    expect(onChangeConfig).toHaveBeenCalledWith({ type: ChartType.Scatter, xField: null, yFields: ['total'] });
  });

  test('scatter is hidden when the result has fewer than two numeric columns', async () => {
    const user = userEvent.setup();
    const result: StructuredQueryResult = {
      columns: ['deployment', 'total'],
      rows: [{ deployment: 'gpt-4o', total: 120 }],
    };
    const meta: ExecutedQueryMeta = { ...META, aggregateColumns: ['total'] };
    renderChart(DEFAULT_CHART_CONFIG, { ...result, rows: [...result.rows, { deployment: 'claude', total: 80 }] }, meta);

    const types = await offeredTypes(user);
    expect(types).not.toContain('Scatter');
    expect(types).toContain('Pie');
  });

  // A fallback-classified SQL run puts its numeric columns in BOTH lists; counting them twice would
  // offer scatter one column to plot against itself.
  test('scatter stays hidden when a fallback meta repeats its only numeric column in both lists', async () => {
    const user = userEvent.setup();
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

    expect(await offeredTypes(user)).not.toContain('Scatter');
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

      await pickType(user, 'Pie');

      expect(onChangeConfig).toHaveBeenCalledWith({ type: ChartType.Pie, xField: 'deployment', yFields: ['tokens'] });
    });

    test('ignores a stored column the result no longer returns', () => {
      renderChart({ type: ChartType.Line, xField: 'deployment', yFields: ['gone', 'total'] });
      expect(screen.queryByRole('button', { name: 'Remove gone' })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove total' })).toBeInTheDocument();
    });
  });

  describe('a second dimension', () => {
    const SPLIT_META: ExecutedQueryMeta = { ...META, dimensionColumns: ['deployment', 'sentiment'] };
    const SPLIT_RESULT: StructuredQueryResult = {
      columns: ['deployment', 'sentiment', 'total', 'tokens'],
      rows: [
        { deployment: 'gpt-4o', sentiment: 'positive', total: 5, tokens: 1 },
        { deployment: 'gpt-4o', sentiment: 'neutral', total: 3, tokens: 1 },
      ],
    };

    test('takes a single Y column and legends one series per split value', () => {
      renderChart(
        { type: ChartType.Line, xField: 'deployment', yFields: ['total', 'tokens'] },
        SPLIT_RESULT,
        SPLIT_META,
      );

      expect(screen.getByRole('combobox', { name: /^QueryBuilder.ChartYAxis/ })).toHaveAccessibleName(/total/);
      expect(screen.queryByRole('button', { name: 'Remove tokens' })).toBeNull();
      expect(screen.getByRole('button', { name: 'positive' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'neutral' })).toBeInTheDocument();
    });
  });

  describe('legend settings', () => {
    test('turns the legend off', async () => {
      const user = userEvent.setup();
      const onChangeConfig = renderChart({ ...DEFAULT_CHART_CONFIG, xField: 'deployment', yFields: ['total'] });

      await user.click(screen.getByRole('switch', { name: 'QueryBuilder.ChartLegendShow' }));

      expect(onChangeConfig).toHaveBeenCalledWith(
        expect.objectContaining({ legend: { isVisible: false, position: ChartLegendPosition.Below } }),
      );
    });

    test('moves the legend', async () => {
      const user = userEvent.setup();
      const onChangeConfig = renderChart({ ...DEFAULT_CHART_CONFIG, xField: 'deployment', yFields: ['total'] });

      await user.click(screen.getByRole('combobox', { name: /^QueryBuilder.ChartLegendPosition/ }));
      await user.click(await screen.findByRole('option', { name: 'QueryBuilder.ChartLegendRight' }));

      expect(onChangeConfig).toHaveBeenCalledWith(
        expect.objectContaining({ legend: { isVisible: true, position: ChartLegendPosition.Right } }),
      );
    });
  });

  describe('scorecard', () => {
    const ONE_ROW: StructuredQueryResult = { columns: ['cost'], rows: [{ cost: 1754 }] };
    const ONE_ROW_META: ExecutedQueryMeta = { ...META, dimensionColumns: [], aggregateColumns: ['cost'] };

    test('shows the value with its label and no axis or legend controls', () => {
      renderChart({ type: ChartType.Scorecard, xField: null, yFields: null }, ONE_ROW, ONE_ROW_META);

      expect(screen.getByText('cost')).toBeInTheDocument();
      expect(screen.getByText('1,754')).toBeInTheDocument();
      expect(screen.queryByRole('combobox', { name: /^QueryBuilder.ChartXAxis/ })).toBeNull();
      expect(screen.queryByRole('switch')).toBeNull();
    });

    test('offers the scorecard only for a single row', async () => {
      const user = userEvent.setup();
      renderChart({ type: ChartType.Bar, xField: null, yFields: null }, ONE_ROW, ONE_ROW_META);

      expect(await offeredTypes(user)).toContain('Scorecard');
    });
  });

  describe('formatting panel', () => {
    beforeEach(() => localStorage.clear());

    test('collapses to a rail, hides its controls and remembers it', async () => {
      const user = userEvent.setup();
      renderChart();

      await user.click(screen.getByRole('button', { name: 'QueryBuilder.ChartFormattingCollapse' }));

      expect(screen.getByRole('button', { name: 'QueryBuilder.ChartFormattingExpand' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
      expect(screen.queryByRole('combobox', { name: /^QueryBuilder.ChartTypeSwitcher/ })).toBeNull();
      expect(localStorage.getItem('query-builder-chart-panel-open')).toBe('false');
    });

    test('opens collapsed when it was left collapsed', async () => {
      localStorage.setItem('query-builder-chart-panel-open', 'false');
      renderChart();

      expect(await screen.findByRole('button', { name: 'QueryBuilder.ChartFormattingExpand' })).toBeInTheDocument();
    });
  });
});
