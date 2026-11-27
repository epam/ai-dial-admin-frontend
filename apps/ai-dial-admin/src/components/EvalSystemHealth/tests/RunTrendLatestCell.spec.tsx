import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ICellRendererParams } from 'ag-grid-community';

import RunTrendLatestCell from '@/src/components/EvalSystemHealth/RunTrendLatestCell';
import { RunTrendRow } from '@/src/components/EvalSystemHealth/models';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';

const renderCell = (latestRate: number | null) =>
  render(
    <RunTrendLatestCell
      {...({ data: { suiteName: 'Docs regression', latestRate } as RunTrendRow } as ICellRendererParams<RunTrendRow>)}
    />,
  );

describe('RunTrendLatestCell', () => {
  test('shows the rate as a percentage with a bar named after the row', () => {
    renderCell(0.8);

    expect(screen.getByText('80%')).toBeTruthy();
    const bar = screen.getByRole('progressbar', {
      name: `Docs regression: ${EvalSystemHealthI18nKey.RunTrendsColumnLatest}`,
    });
    expect(bar.getAttribute('aria-valuenow')).toBe('80');
  });

  test('shows a dash and no bar when the newest run has no rate', () => {
    renderCell(null);

    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  test('shows 0% with an empty bar for a rate of zero', () => {
    renderCell(0);

    expect(screen.getByText('0%')).toBeTruthy();
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('0');
  });
});
