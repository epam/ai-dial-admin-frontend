import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ColDef, GridOptions } from 'ag-grid-community';

import RunTrendsTable from '@/src/components/EvalSystemHealth/RunTrendsTable';
import { RunTrendRow } from '@/src/components/EvalSystemHealth/models';
import { EvalSystemHealthI18nKey } from '@/src/constants/i18n';

const grid = vi.hoisted(() => ({
  columnDefs: [] as ColDef[],
  rowData: [] as RunTrendRow[],
  options: undefined as GridOptions | undefined,
}));

// The real GridView renders; only the AG Grid wrapper, which does not run in jsdom, is replaced.
vi.mock('@/src/components/Grid/AgGridWrapper', () => ({
  default: ({
    columnDefs,
    rowData,
    additionalGridOptions,
  }: {
    columnDefs?: ColDef[];
    rowData?: RunTrendRow[];
    additionalGridOptions?: GridOptions;
  }) => {
    grid.columnDefs = columnDefs ?? [];
    grid.rowData = rowData ?? [];
    grid.options = additionalGridOptions;
    return <section aria-label="grid" />;
  },
}));

const rows: RunTrendRow[] = [
  {
    suiteId: 'a',
    suiteName: 'Docs regression',
    evaluateeName: 'GPT-4o',
    kindKey: EvalSystemHealthI18nKey.RunTrendsKindModel,
    points: [0.5, 0.6],
    latestRate: 0.6,
    deltaLabel: '+10%',
  },
];

describe('RunTrendsTable — real grid', () => {
  test('hands the five columns and the rows to the grid', () => {
    render(<RunTrendsTable rows={rows} />);

    expect(screen.getByRole('region', { name: 'grid' })).toBeTruthy();
    expect(grid.columnDefs.map((column) => column.headerName)).toEqual([
      EvalSystemHealthI18nKey.RunTrendsColumnSuite,
      EvalSystemHealthI18nKey.RunTrendsColumnEvaluatee,
      EvalSystemHealthI18nKey.RunTrendsColumnTrend,
      EvalSystemHealthI18nKey.RunTrendsColumnLatest,
      EvalSystemHealthI18nKey.RunTrendsColumnDelta,
    ]);
    expect(grid.rowData).toEqual(rows);
  });

  test('sizes the grid to its rows with a row tall enough for two lines', () => {
    render(<RunTrendsTable rows={rows} />);

    expect(grid.options).toMatchObject({ domLayout: 'autoHeight', rowHeight: 64 });
  });
});
