import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import TableDetailView from '@/src/components/Analytics/Tables/TableDetailView';
import { AnalyticsTablesI18nKey, ButtonsI18nKey } from '@/src/constants/i18n';
import { AnalyticsTable, AnalyticsTableType, TableStatus } from '@/src/models/analytics/table';

vi.mock('@/src/app/[lang]/tables/actions');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const permissions = { canCreate: true, canDelete: true, canManageRoles: true, canWrite: true, canModify: true };
vi.mock('@/src/hooks/use-analytics-table-permissions', () => ({
  useAnalyticsTablePermissions: () => permissions,
}));

// Panel loads server data on mount — stub it; its own behavior is covered in TableAccessPanel.spec.
vi.mock('@/src/components/Analytics/Tables/TableAccessPanel', () => ({ default: () => <div>access panel</div> }));

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

// Defaults to ACTIVE so the permission-gating tests below exercise the live (write/add-columns) surface;
// the lifecycle-status tests at the bottom override `status` explicitly.
const table = (overrides: Partial<AnalyticsTable> = {}): AnalyticsTable => ({
  name: 'dial_usage_log',
  type: AnalyticsTableType.Source,
  status: TableStatus.Active,
  columns: [],
  ...overrides,
});

const setPerms = (over: Partial<typeof permissions>) =>
  Object.assign(
    permissions,
    { canCreate: false, canDelete: false, canManageRoles: false, canWrite: false, canModify: false },
    over,
  );

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(permissions, {
    canCreate: true,
    canDelete: true,
    canManageRoles: true,
    canWrite: true,
    canModify: true,
  });
});

describe('TableDetailView action gating', () => {
  test('an admin with full permissions sees all mutating actions', () => {
    render(<TableDetailView name="dial_usage_log" initialTable={table()} />);

    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.DeleteTable })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.WriteRows })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.ManageAccess })).toBeInTheDocument();
  });

  test('write-only capability shows Write rows but not schema/delete actions', () => {
    setPerms({ canWrite: true });
    render(<TableDetailView name="dial_usage_log" initialTable={table()} />);

    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.WriteRows })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.DeleteTable })).not.toBeInTheDocument();
  });

  test('modify-only capability shows Add columns but not Write rows', () => {
    setPerms({ canModify: true });
    render(<TableDetailView name="dial_usage_log" initialTable={table()} />);

    expect(screen.getByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.WriteRows })).not.toBeInTheDocument();
  });

  test('delete is hidden when the user cannot delete even with edit permissions', () => {
    setPerms({ canWrite: true, canModify: true });
    render(<TableDetailView name="dial_usage_log" initialTable={table()} />);

    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.DeleteTable })).not.toBeInTheDocument();
  });

  test('a fully-denied user (e.g. a system table) sees no actions but keeps the read-only badge', () => {
    setPerms({});
    render(<TableDetailView name="dial_usage_log" initialTable={table({ system: true })} />);

    expect(screen.getByText(AnalyticsTablesI18nKey.SystemReadOnly)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.DeleteTable })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.WriteRows })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.AddColumns })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.ManageAccess })).not.toBeInTheDocument();
  });

  test('the role-management action is hidden when the user cannot manage roles', () => {
    setPerms({ canWrite: true, canModify: true });
    render(<TableDetailView name="dial_usage_log" initialTable={table()} />);

    expect(screen.queryByRole('button', { name: AnalyticsTablesI18nKey.ManageAccess })).not.toBeInTheDocument();
  });
});

describe('TableDetailView columns grid', () => {
  test('the grid includes Display name and Description columns', () => {
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
