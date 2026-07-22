import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import TableDetailView from '@/src/components/Analytics/Tables/TableDetailView';
import { AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { AnalyticsTable, AnalyticsTableType } from '@/src/models/analytics/table';

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

const table = (over: Partial<AnalyticsTable> = {}): AnalyticsTable => ({
  name: 'dial_usage_log',
  type: AnalyticsTableType.Source,
  columns: [],
  ...over,
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
