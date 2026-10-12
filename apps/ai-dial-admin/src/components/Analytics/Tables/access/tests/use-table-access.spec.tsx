import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  deleteRowPolicy,
  getRowPolicies,
  getTableAccess,
  putRowPolicy,
  updateTableAccess,
} from '@/src/app/[lang]/tables/actions';
import { AccessStatus, RowsCellKind } from '@/src/components/Analytics/Tables/access/models';
import { useTableAccess } from '@/src/components/Analytics/Tables/access/use-table-access';
import { AnalyticsTableAccessI18nKey, AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { QueryExprType, QueryFilterNode, QueryOperator, QueryValueType } from '@/src/models/analytics/query';
import { RowPolicies, TableAccess, TableAccessUpdateResult } from '@/src/models/analytics/table';

const showNotification = vi.hoisted(() => vi.fn());
vi.mock('@/src/context/NotificationContext', () => ({ useNotification: () => ({ showNotification }) }));
vi.mock('@/src/app/[lang]/tables/actions');

const filter: QueryFilterNode = {
  op: QueryOperator.Eq,
  args: [
    { type: QueryExprType.Field, name: 'project_id' },
    { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'X-PRJ-1' },
  ],
};

const noSelection = { get: false, read: false, write: false, modify: false, sensitive: false };

const mockLoad = (
  lists: Partial<TableAccess> = { read: ['team-x'], write: ['ingest-bot'] },
  policies: RowPolicies = {},
) => {
  vi.mocked(getTableAccess).mockResolvedValue({ success: true, response: lists as TableAccess });
  vi.mocked(getRowPolicies).mockResolvedValue({ success: true, response: { policies } });
};

const renderLoaded = async (isEnabled = true) => {
  const view = renderHook(() => useTableAccess('events', isEnabled));
  if (isEnabled) await waitFor(() => expect(view.result.current.status).not.toBe(AccessStatus.Loading));

  return view;
};

beforeEach(() => {
  vi.clearAllMocks();
  mockLoad();
});

describe('useTableAccess — loading', () => {
  test('reads the access lists and the row policies together and offers the tab with its count', async () => {
    mockLoad({ read: ['team-x'], write: ['ingest-bot'] }, { 'team-x': { filter }, lonely: { filter } });

    const { result } = await renderLoaded();

    expect(getTableAccess).toHaveBeenCalledWith('events');
    expect(getRowPolicies).toHaveBeenCalledWith('events');
    expect(result.current.status).toBe(AccessStatus.Ready);
    expect(result.current.isTabOffered).toBe(true);
    expect(result.current.rows.map((row) => row.role)).toEqual(['ingest-bot', 'lonely', 'team-x']);
    expect(result.current.rows.find((row) => row.role === 'team-x')?.rowsKind).toBe(RowsCellKind.Policy);
  });

  test('requests nothing while disabled', async () => {
    const { result } = await renderLoaded(false);

    expect(getTableAccess).not.toHaveBeenCalled();
    expect(getRowPolicies).not.toHaveBeenCalled();
    expect(result.current.isTabOffered).toBe(false);
  });

  test('does not offer the tab while the reads are in flight', () => {
    vi.mocked(getTableAccess).mockReturnValue(new Promise(() => undefined));
    vi.mocked(getRowPolicies).mockReturnValue(new Promise(() => undefined));

    const { result } = renderHook(() => useTableAccess('events', true));

    expect(result.current.status).toBe(AccessStatus.Loading);
    expect(result.current.isTabOffered).toBe(false);
  });

  test('removes the tab without a notification when the access read is forbidden', async () => {
    vi.mocked(getTableAccess).mockResolvedValue({ success: false, status: 403 });

    const { result } = await renderLoaded();

    expect(result.current.status).toBe(AccessStatus.Forbidden);
    expect(result.current.isTabOffered).toBe(false);
    expect(showNotification).not.toHaveBeenCalled();
  });

  test('removes the tab without a notification when the policies read is forbidden', async () => {
    vi.mocked(getRowPolicies).mockResolvedValue({ success: false, status: 403 });

    const { result } = await renderLoaded();

    expect(result.current.status).toBe(AccessStatus.Forbidden);
    expect(showNotification).not.toHaveBeenCalled();
  });

  test('notifies and keeps the tab offered when the access read fails otherwise', async () => {
    vi.mocked(getTableAccess).mockResolvedValue({ success: false, status: 500, errorHeader: 'boom' });

    const { result } = await renderLoaded();

    expect(result.current.status).toBe(AccessStatus.Failed);
    expect(result.current.isTabOffered).toBe(true);
    expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ title: 'boom' }));
  });

  test('uses the fallback title when the failed read carries none', async () => {
    vi.mocked(getTableAccess).mockResolvedValue({ success: false, status: 500 });

    await renderLoaded();

    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: AnalyticsTablesI18nKey.AccessLoadFailed }),
    );
  });

  test('notifies with its own title when the policies read fails', async () => {
    vi.mocked(getRowPolicies).mockResolvedValue({ success: false, status: 500 });

    const { result } = await renderLoaded();

    expect(result.current.status).toBe(AccessStatus.Failed);
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: AnalyticsTableAccessI18nKey.RowPoliciesLoadFailed }),
    );
  });
});

describe('useTableAccess — saveGrants', () => {
  test('reads the lists again, then sends only the changed key with every other grantee kept', async () => {
    const { result } = await renderLoaded();
    // Another admin added a role after the first read.
    vi.mocked(getTableAccess).mockResolvedValue({
      success: true,
      response: { read: ['team-x', 'analysts'] } as TableAccess,
    });
    vi.mocked(updateTableAccess).mockResolvedValue({
      success: true,
      response: { read: ['team-x', 'analysts', 'team-z'] } as unknown as TableAccessUpdateResult,
    });

    let outcome: Awaited<ReturnType<typeof result.current.saveGrants>> | undefined;
    await act(async () => {
      outcome = await result.current.saveGrants('team-z', { ...noSelection, read: true });
    });

    expect(getTableAccess).toHaveBeenCalledTimes(2);
    expect(updateTableAccess).toHaveBeenCalledWith('events', { read: ['team-x', 'analysts', 'team-z'] });
    expect(outcome?.isOk).toBe(true);
    expect(result.current.rows.map((row) => row.role)).toContain('team-z');
  });

  test('sends nothing when the selection matches what is stored', async () => {
    const { result } = await renderLoaded();

    let outcome: Awaited<ReturnType<typeof result.current.saveGrants>> | undefined;
    await act(async () => {
      outcome = await result.current.saveGrants('team-x', { ...noSelection, read: true });
    });

    expect(updateTableAccess).not.toHaveBeenCalled();
    expect(outcome).toEqual({ isOk: true });
  });

  test('hands back the service answer so the caller can show ineffective grants', async () => {
    const { result } = await renderLoaded();
    const answer = { read: ['team-x', 'team-z'], ineffective_grants: [{ role: 'team-z', key: 'read' }] };
    vi.mocked(updateTableAccess).mockResolvedValue({ success: true, response: answer as never });

    let outcome: Awaited<ReturnType<typeof result.current.saveGrants>> | undefined;
    await act(async () => {
      outcome = await result.current.saveGrants('team-z', { ...noSelection, read: true });
    });

    expect(outcome?.result).toBe(answer);
  });

  test('notifies and reports failure when the update is refused, leaving the lists as they were', async () => {
    const { result } = await renderLoaded();
    vi.mocked(updateTableAccess).mockResolvedValue({
      success: false,
      status: 422,
      errorHeader: 'refused',
      errorMessage: 'sensitive_grant_widens',
      requestId: 'req-1',
    });

    let outcome: Awaited<ReturnType<typeof result.current.saveGrants>> | undefined;
    await act(async () => {
      outcome = await result.current.saveGrants('team-z', { ...noSelection, read: true });
    });

    expect(outcome?.isOk).toBe(false);
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'refused', description: 'sensitive_grant_widens', requestId: 'req-1' }),
    );
    expect(result.current.rows.map((row) => row.role)).not.toContain('team-z');
  });

  test('does not update when the fresh read fails', async () => {
    const { result } = await renderLoaded();
    vi.mocked(getTableAccess).mockResolvedValue({ success: false, status: 500 });

    let outcome: Awaited<ReturnType<typeof result.current.saveGrants>> | undefined;
    await act(async () => {
      outcome = await result.current.saveGrants('team-z', { ...noSelection, read: true });
    });

    expect(outcome?.isOk).toBe(false);
    expect(updateTableAccess).not.toHaveBeenCalled();
  });
});

describe('useTableAccess — saveRowPolicy', () => {
  test('stores a policy and shows it on the role', async () => {
    const { result } = await renderLoaded();
    vi.mocked(putRowPolicy).mockResolvedValue({ success: true, response: { filter } });

    let outcome;
    await act(async () => {
      outcome = await result.current.saveRowPolicy('team-x', filter);
    });

    expect(putRowPolicy).toHaveBeenCalledWith('events', 'team-x', { filter });
    expect(outcome).toEqual({ isOk: true });
    expect(result.current.rows.find((row) => row.role === 'team-x')?.rowsKind).toBe(RowsCellKind.Policy);
  });

  test('removes an existing policy when given no filter', async () => {
    mockLoad({ read: ['team-x'] }, { 'team-x': { filter } });
    const { result } = await renderLoaded();
    vi.mocked(deleteRowPolicy).mockResolvedValue({ success: true });

    await act(async () => {
      await result.current.saveRowPolicy('team-x', null);
    });

    expect(deleteRowPolicy).toHaveBeenCalledWith('events', 'team-x');
    expect(result.current.rows.find((row) => row.role === 'team-x')?.rowsKind).toBe(RowsCellKind.All);
  });

  test('sends nothing when removing a policy the role does not have', async () => {
    const { result } = await renderLoaded();

    let outcome;
    await act(async () => {
      outcome = await result.current.saveRowPolicy('team-x', null);
    });

    expect(outcome).toEqual({ isOk: true });
    expect(deleteRowPolicy).not.toHaveBeenCalled();
    expect(putRowPolicy).not.toHaveBeenCalled();
  });

  test('returns the service message of a refusal and notifies', async () => {
    const { result } = await renderLoaded();
    vi.mocked(putRowPolicy).mockResolvedValue({ success: false, status: 422, errorMessage: 'region is not a column' });

    let outcome;
    await act(async () => {
      outcome = await result.current.saveRowPolicy('team-x', filter);
    });

    expect(outcome).toEqual({ isOk: false, errorMessage: 'region is not a column' });
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: AnalyticsTableAccessI18nKey.RowLimitSaveFailed }),
    );
    expect(result.current.rows.find((row) => row.role === 'team-x')?.rowsKind).toBe(RowsCellKind.All);
  });

  test('keeps the policy and notifies when the delete fails', async () => {
    mockLoad({ read: ['team-x'] }, { 'team-x': { filter } });
    const { result } = await renderLoaded();
    vi.mocked(deleteRowPolicy).mockResolvedValue({ success: false, status: 500 });

    let outcome;
    await act(async () => {
      outcome = await result.current.saveRowPolicy('team-x', null);
    });

    expect(outcome).toMatchObject({ isOk: false });
    expect(result.current.rows.find((row) => row.role === 'team-x')?.rowsKind).toBe(RowsCellKind.Policy);
  });
});

describe('useTableAccess — removeRole', () => {
  test('sends only the lists that name the role, then deletes its policy', async () => {
    mockLoad({ read: ['team-x', 'other'], write: ['team-x'], modify: ['other'] }, { 'team-x': { filter } });
    const { result } = await renderLoaded();
    vi.mocked(updateTableAccess).mockResolvedValue({
      success: true,
      response: { read: ['other'], write: [] } as never,
    });
    vi.mocked(deleteRowPolicy).mockResolvedValue({ success: true });

    let isRemoved: boolean | undefined;
    await act(async () => {
      isRemoved = await result.current.removeRole('team-x');
    });

    expect(updateTableAccess).toHaveBeenCalledWith('events', { read: ['other'], write: [] });
    expect(deleteRowPolicy).toHaveBeenCalledWith('events', 'team-x');
    expect(isRemoved).toBe(true);
    expect(result.current.rows.map((row) => row.role)).toEqual(['other']);
  });

  test('sends no policy delete for a role without a policy', async () => {
    const { result } = await renderLoaded();
    vi.mocked(updateTableAccess).mockResolvedValue({ success: true, response: { read: [] } as never });

    await act(async () => {
      await result.current.removeRole('team-x');
    });

    expect(deleteRowPolicy).not.toHaveBeenCalled();
  });

  test('sends no access update for a role no list names', async () => {
    mockLoad({ read: ['other'] }, { lonely: { filter } });
    const { result } = await renderLoaded();
    vi.mocked(deleteRowPolicy).mockResolvedValue({ success: true });

    await act(async () => {
      await result.current.removeRole('lonely');
    });

    expect(updateTableAccess).not.toHaveBeenCalled();
    expect(deleteRowPolicy).toHaveBeenCalledWith('events', 'lonely');
  });

  test('stops, notifies and reports failure when the access update fails', async () => {
    const { result } = await renderLoaded();
    vi.mocked(updateTableAccess).mockResolvedValue({ success: false, status: 500 });

    let isRemoved: boolean | undefined;
    await act(async () => {
      isRemoved = await result.current.removeRole('team-x');
    });

    expect(isRemoved).toBe(false);
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: AnalyticsTableAccessI18nKey.RemoveFailed }),
    );
    expect(result.current.rows.map((row) => row.role)).toContain('team-x');
  });

  test('reports failure when the fresh read fails', async () => {
    const { result } = await renderLoaded();
    vi.mocked(getTableAccess).mockResolvedValue({ success: false, status: 500 });

    let isRemoved: boolean | undefined;
    await act(async () => {
      isRemoved = await result.current.removeRole('team-x');
    });

    expect(isRemoved).toBe(false);
    expect(updateTableAccess).not.toHaveBeenCalled();
  });
});
