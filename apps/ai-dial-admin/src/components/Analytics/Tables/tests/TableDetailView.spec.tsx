import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import TableDetailView from '@/src/components/Analytics/Tables/TableDetailView';
import { AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { AnalyticsTable, AnalyticsTableType, TableStatus } from '@/src/models/analytics/table';

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

// The draft-schema surface's own behavior (completeness gating, column/key controls) is covered in
// DraftSchemaEditor.spec.tsx; here we only assert TableDetailView renders it for a non-active table.
vi.mock('@/src/components/Analytics/Tables/DraftSchemaEditor', () => ({
  default: () => <div>draft-schema-editor</div>,
}));

const table = (overrides: Partial<AnalyticsTable> = {}): AnalyticsTable => ({
  name: 'dial_usage_log',
  type: AnalyticsTableType.Source,
  status: TableStatus.Active,
  columns: [],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

// Edit/Delete for the table itself now live only in the catalog's row action menu (TablesView) — this
// view's header only ever offers Write rows / Add columns (ACTIVE) or Save (draft).
describe('TableDetailView system flag', () => {
  test('a non-system table shows the modify actions', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table({ system: false })} />);

    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.WriteRows })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).toBeInTheDocument();
    expect(screen.queryByText(AnalyticsTablesI18nKey.SystemReadOnly)).not.toBeInTheDocument();
  });

  test('a system table is read-only: modify actions hidden, read-only badge shown', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table({ system: true })} />);

    expect(screen.getByText(AnalyticsTablesI18nKey.SystemReadOnly)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.WriteRows })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).not.toBeInTheDocument();
  });
});

describe('TableDetailView columns grid', () => {
  test('the grid includes Label and Description columns', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table()} />);

    const headers = screen.getByText(/^headers:/);
    expect(headers).toHaveTextContent(AnalyticsTablesI18nKey.DisplayName);
    expect(headers).toHaveTextContent(AnalyticsTablesI18nKey.Description);
  });
});

describe('TableDetailView lifecycle status', () => {
  test('an ACTIVE table shows the live grid and write/add-columns actions', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table({ status: TableStatus.Active })} />);

    expect(screen.getByText(/^columns:/)).toBeInTheDocument();
    expect(screen.queryByText('draft-schema-editor')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.WriteRows })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).toBeInTheDocument();
  });

  test('a PENDING table shows the draft schema editor and hides write/add-columns actions', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table({ status: TableStatus.Pending })} />);

    expect(screen.getByText('draft-schema-editor')).toBeInTheDocument();
    expect(screen.queryByText(/^columns:/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.WriteRows })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).not.toBeInTheDocument();
  });

  test('a FAILED table also shows the draft schema editor', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table({ status: TableStatus.Failed })} />);

    expect(screen.getByText('draft-schema-editor')).toBeInTheDocument();
  });

  test('the status badge reflects the table status', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table({ status: TableStatus.Pending })} />);

    expect(screen.getByText(AnalyticsTablesI18nKey.StatusPending)).toBeInTheDocument();
  });

  test('a PENDING table shows a header Save action, disabled until the draft is complete', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table({ status: TableStatus.Pending })} />);

    expect(screen.getByRole('button', { name: ButtonsI18nKey.Save })).toBeDisabled();
  });
});
