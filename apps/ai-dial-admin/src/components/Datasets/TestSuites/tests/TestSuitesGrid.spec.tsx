import { render, screen } from '@testing-library/react';
import { ColDef } from 'ag-grid-community';
import { describe, expect, test, vi } from 'vitest';

import DatasetTestSuites from '@/src/components/Datasets/TestSuites/TestSuites';
import { ACTIONS_COLUMN_CEL_ID } from '@/src/constants/ag-grid';

const grid = vi.hoisted(() => ({ columnDefs: [] as ColDef[] }));

vi.mock('@/src/app/[lang]/datasets/actions', () => ({ getDatasetTestSuitesPage: vi.fn() }));

// The real GridView renders; only the AG Grid wrapper, which does not run in jsdom, is replaced.
vi.mock('@/src/components/Grid/AgGridWrapper', () => ({
  default: ({ columnDefs }: { columnDefs?: ColDef[] }) => {
    grid.columnDefs = columnDefs ?? [];
    return <section aria-label="grid" />;
  },
}));

describe('DatasetTestSuites — real grid', () => {
  test('hands the test suites columns and an actions column to the grid', () => {
    render(<DatasetTestSuites datasetId="ds-1" />);

    expect(screen.getByRole('region', { name: 'grid' })).toBeTruthy();
    expect(
      grid.columnDefs.filter((col) => col.field !== ACTIONS_COLUMN_CEL_ID && !col.hide).map((col) => col.headerName),
    ).toEqual([
      'Display Name',
      'Description',
      'ID',
      'Suite Type',
      'Application',
      expect.any(String),
      expect.any(String),
      'Created By',
    ]);
    expect(grid.columnDefs.some((col) => col.field === ACTIONS_COLUMN_CEL_ID)).toBe(true);
  });
});
