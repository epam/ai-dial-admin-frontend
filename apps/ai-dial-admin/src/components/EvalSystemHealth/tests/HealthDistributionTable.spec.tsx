import { describe, expect, test } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import HealthDistributionTable from '@/src/components/EvalSystemHealth/HealthDistributionTable';
import { HealthDistributionBar } from '@/src/components/EvalSystemHealth/models';

const bars: HealthDistributionBar[] = [
  {
    weekStart: 1,
    label: 'Nov 3',
    healthyCount: 21,
    failingCount: 11,
    suiteCount: 32,
    healthyShare: 65.6,
    failingShare: 34.4,
  },
  {
    weekStart: 2,
    label: 'Nov 10',
    healthyCount: 0,
    failingCount: 0,
    suiteCount: 0,
    healthyShare: null,
    failingShare: null,
  },
];

describe('HealthDistributionTable', () => {
  test('is named after the section', () => {
    render(<HealthDistributionTable bars={bars} label="Health distribution" />);

    expect(screen.getByRole('table', { name: 'Health distribution' })).toBeTruthy();
  });

  test('has a row per week and a header row', () => {
    render(<HealthDistributionTable bars={bars} label="Health distribution" />);

    expect(screen.getAllByRole('row')).toHaveLength(3);
  });

  test('states the week, the healthy count and share, and the failing count and share', () => {
    render(<HealthDistributionTable bars={bars} label="Health distribution" />);

    const row = screen.getByRole('row', { name: /Nov 3/ });
    expect(within(row).getByRole('rowheader')).toHaveTextContent('Nov 3');
    expect(
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['21 (65.6%)', '11 (34.4%)']);
  });

  test('shows a dash for a week with no suite', () => {
    render(<HealthDistributionTable bars={bars} label="Health distribution" />);

    const row = screen.getByRole('row', { name: /Nov 10/ });
    expect(
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent),
    ).toEqual(['—', '—']);
  });
});
