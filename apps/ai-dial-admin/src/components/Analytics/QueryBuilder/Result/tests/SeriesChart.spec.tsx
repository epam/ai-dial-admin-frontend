import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import SeriesChart from '@/src/components/Analytics/QueryBuilder/Result/SeriesChart';

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
