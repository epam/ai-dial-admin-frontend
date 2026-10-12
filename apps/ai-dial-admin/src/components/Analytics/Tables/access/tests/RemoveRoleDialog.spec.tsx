import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { PrivilegeMark, RoleRow, RowsCellKind } from '@/src/components/Analytics/Tables/access/models';
import RemoveRoleDialog from '@/src/components/Analytics/Tables/access/RemoveRoleDialog';
import { AnalyticsTableAccessI18nKey } from '@/src/constants/i18n';
import { QueryExprType, QueryOperator, QueryValueType } from '@/src/models/analytics/query';

const showNotification = vi.hoisted(() => vi.fn());
vi.mock('@/src/context/NotificationContext', () => ({ useNotification: () => ({ showNotification }) }));

const row = (over: Partial<RoleRow> = {}): RoleRow => ({
  role: 'team-x',
  marks: {
    get: PrivilegeMark.Implied,
    read: PrivilegeMark.Stored,
    write: PrivilegeMark.None,
    modify: PrivilegeMark.None,
  },
  isSensitive: false,
  rowsKind: RowsCellKind.All,
  ...over,
});

const policyFilter = {
  op: QueryOperator.Eq,
  args: [
    { type: QueryExprType.Field as const, name: 'project_id' },
    { type: QueryExprType.Value as const, value_type: QueryValueType.String, value: 'X-PRJ-1' },
  ],
};

const renderDialog = (props: Partial<React.ComponentProps<typeof RemoveRoleDialog>> = {}) =>
  render(
    <RemoveRoleDialog
      tableName="project_costs_daily"
      row={row()}
      onRemove={vi.fn().mockResolvedValue(true)}
      onClose={vi.fn()}
      {...props}
    />,
  );

beforeEach(() => vi.clearAllMocks());

describe('RemoveRoleDialog', () => {
  test('names the role and the table and warns that the users may then see every row', () => {
    renderDialog();

    expect(screen.getByText(AnalyticsTableAccessI18nKey.RemoveTitle)).toBeInTheDocument();
    expect(screen.getByText('project_costs_daily')).toBeInTheDocument();
    expect(screen.getByText(AnalyticsTableAccessI18nKey.RemoveWarning)).toBeInTheDocument();
  });

  test('describes a read-only role as Read with Get', () => {
    renderDialog();

    expect(screen.getByText(AnalyticsTableAccessI18nKey.RemoveReadWithGet)).toBeInTheDocument();
  });

  test('lists every privilege a role with more than read holds', () => {
    renderDialog({
      row: row({
        marks: {
          get: PrivilegeMark.Implied,
          read: PrivilegeMark.Stored,
          write: PrivilegeMark.Stored,
          modify: PrivilegeMark.None,
        },
      }),
    });

    expect(screen.getByText(/ColGet.*ColRead.*ColWrite/)).toBeInTheDocument();
  });

  test('lists the sensitive clearance among what is removed', () => {
    renderDialog({ row: row({ isSensitive: true }) });

    expect(
      screen.getByText(
        `${AnalyticsTableAccessI18nKey.RemoveReadWithGet}, ${AnalyticsTableAccessI18nKey.SummarySensitive}`,
      ),
    ).toBeInTheDocument();
  });

  test('lists the sensitive clearance of a role that holds nothing else', () => {
    renderDialog({
      row: row({
        marks: {
          get: PrivilegeMark.None,
          read: PrivilegeMark.None,
          write: PrivilegeMark.None,
          modify: PrivilegeMark.None,
        },
        isSensitive: true,
      }),
    });

    expect(screen.getByText(AnalyticsTableAccessI18nKey.SummarySensitive)).toBeInTheDocument();
  });

  test('lists the row limit when the role has one', () => {
    renderDialog({ row: row({ rowsKind: RowsCellKind.Policy, filter: policyFilter }) });

    expect(screen.getByText(AnalyticsTableAccessI18nKey.RemoveRowLimit)).toBeInTheDocument();
    expect(screen.getByText('project_id = X-PRJ-1')).toBeInTheDocument();
  });

  test('lists no row limit for a role without one', () => {
    renderDialog();

    expect(screen.queryByText(AnalyticsTableAccessI18nKey.RemoveRowLimit)).toBeNull();
  });

  test('lists no access for a role that has only a row policy', () => {
    renderDialog({
      row: row({
        marks: {
          get: PrivilegeMark.None,
          read: PrivilegeMark.None,
          write: PrivilegeMark.None,
          modify: PrivilegeMark.None,
        },
        rowsKind: RowsCellKind.Policy,
        filter: policyFilter,
      }),
    });

    expect(screen.queryByText(AnalyticsTableAccessI18nKey.RemoveAccess)).toBeNull();
  });

  test('removes the role, shows a success notification and closes when confirmed', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn().mockResolvedValue(true);
    const onClose = vi.fn();
    renderDialog({ onRemove, onClose });

    await user.click(screen.getByRole('button', { name: AnalyticsTableAccessI18nKey.RemoveRole }));

    expect(onRemove).toHaveBeenCalledWith('team-x');
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: AnalyticsTableAccessI18nKey.RoleRemoved }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  test('stays open without a success notification when the removal fails', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderDialog({ onRemove: vi.fn().mockResolvedValue(false), onClose });

    await user.click(screen.getByRole('button', { name: AnalyticsTableAccessI18nKey.RemoveRole }));

    expect(showNotification).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('changes nothing when cancelled', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onClose = vi.fn();
    renderDialog({ onRemove, onClose });

    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onRemove).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
