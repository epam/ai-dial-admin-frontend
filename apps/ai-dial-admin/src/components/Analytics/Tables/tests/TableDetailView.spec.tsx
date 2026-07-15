import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import TableDetailView from '@/src/components/Analytics/Tables/TableDetailView';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/tables/actions');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

vi.mock('@/src/components/Grid/GridView/GridView', () => ({
  default: ({ rowData, columnDefs }: { rowData?: unknown[]; columnDefs?: { headerName?: string }[] }) => (
    <div>
      <div>headers: {columnDefs?.map((c) => c.headerName).join('|')}</div>
      <div>columns: {rowData?.length ?? 0}</div>
    </div>
  ),
}));

const table = (system: boolean): AnalyticsTable => ({
  name: 'dial_usage_log',
  type: AnalyticsTableType.Source,
  system,
  columns: [],
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TableDetailView system flag', () => {
  test('a non-system table shows the modify actions', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table(false)} />);

    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.DeleteTable })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.WriteRows })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.SystemReadOnly)).not.toBeInTheDocument();
  });

  test('a system table is read-only: modify actions hidden, read-only badge shown', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table(true)} />);

    expect(screen.getByText(AnalyticsTablesI18nKey.SystemReadOnly)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.DeleteTable })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.WriteRows })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).not.toBeInTheDocument();
  });
});

describe('TableDetailView columns grid', () => {
  test('the grid includes Label and Description columns', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table(false)} />);

    const headers = screen.getByText(/^headers:/);
    expect(headers).toHaveTextContent(AnalyticsTablesI18nKey.DisplayName);
    expect(headers).toHaveTextContent(AnalyticsTablesI18nKey.Description);
  });
});
