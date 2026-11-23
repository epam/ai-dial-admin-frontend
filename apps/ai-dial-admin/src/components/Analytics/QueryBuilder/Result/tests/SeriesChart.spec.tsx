import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import SeriesChart from '@/src/components/Analytics/QueryBuilder/Result/SeriesChart';
import { ChartLegendConfig, ChartLegendPosition } from '@/src/models/analytics/query-builder';

const series = (names: string[]) => ({
  series: names.map((name, index) => ({ type: 'line', name, data: [1], itemStyle: { color: `#00000${index}` } })),
});

describe('SeriesChart', () => {
  test('shows a legend entry for every series of a multi-series chart', () => {
    render(<SeriesChart option={series(['Returning', 'New'])} />);
    expect(screen.getByRole('button', { name: 'Returning' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'New' })).toBeTruthy();
  });

  test('shows no legend for a single series', () => {
    render(<SeriesChart option={series(['Returning'])} />);
    expect(screen.queryByRole('list')).toBeNull();
  });

  test('pins a series from its legend entry and unpins it on a second click', async () => {
    const user = userEvent.setup();
    render(<SeriesChart option={series(['Returning', 'New'])} />);
    const entry = screen.getByRole('button', { name: 'New' });

    await user.click(entry);
    expect(entry.getAttribute('aria-pressed')).toBe('true');

    await user.click(entry);
    expect(entry.getAttribute('aria-pressed')).toBe('false');
  });

  test('names the plot when a label is given, keeping the legend outside it', () => {
    render(<SeriesChart option={series(['Returning', 'New'])} ariaLabel="Users per week" />);
    const plot = screen.getByRole('img', { name: 'Users per week' });
    expect(plot.contains(screen.getByRole('button', { name: 'New' }))).toBe(false);
  });
});

describe('SeriesChart — legend configuration', () => {
  const renderWithLegend = (legendConfig: ChartLegendConfig) =>
    render(<SeriesChart option={series(['Returning', 'New'])} legendConfig={legendConfig} />);

  test('hides the legend when it is turned off', () => {
    renderWithLegend({ isVisible: false, position: ChartLegendPosition.Below });

    expect(screen.queryByRole('list')).toBeNull();
  });

  test.each([
    [ChartLegendPosition.Above, 'flex-col-reverse'],
    [ChartLegendPosition.Below, 'flex-col'],
    [ChartLegendPosition.Left, 'flex-row-reverse'],
    [ChartLegendPosition.Right, 'flex-row'],
  ])('places the legend %s the chart', (position, layoutClass) => {
    renderWithLegend({ isVisible: true, position });

    expect(screen.getByRole('list').parentElement).toHaveClass(layoutClass);
  });
});

describe('SeriesChart — a changed set of series', () => {
  test('drops the pinned series when the chart draws other series', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<SeriesChart option={series(['Returning', 'New'])} />);
    await user.click(screen.getByRole('button', { name: 'New' }));

    rerender(<SeriesChart option={series(['positive', 'neutral'])} />);

    expect(screen.getByRole('button', { name: 'neutral' }).getAttribute('aria-pressed')).toBe('false');
  });
});
