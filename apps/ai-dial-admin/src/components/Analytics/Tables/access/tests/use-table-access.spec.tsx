import { notificationMock } from '@/test-mocks/notification';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { deleteTableAccessEntry, getTableAccess, putTableAccessEntry } from '@/src/app/[lang]/tables/actions';
import { AccessChangeOutcome, AccessStatus, RowsCellKind } from '@/src/components/Analytics/Tables/access/models';
import { SaveEntryResult, useTableAccess } from '@/src/components/Analytics/Tables/access/use-table-access';
import { AnalyticsTableAccessI18nKey, AnalyticsTablesI18nKey } from '@/src/constants/i18n';
import { QueryExprType, QueryFilterNode, QueryOperator, QueryValueType } from '@/src/models/analytics/query';
import {
  IneffectiveGrant,
  IneffectiveGrantReason,
  TableAccessConfig,
  TableAccessEntry,
  TableAccessEntryResult,
  TableGrantKey,
} from '@/src/models/analytics/table';

const { showNotification } = notificationMock;

vi.mock('@/src/app/[lang]/tables/actions');

const filter: QueryFilterNode = {
  op: QueryOperator.Eq,
  args: [
    { type: QueryExprType.Field, name: 'project_id' },
    { type: QueryExprType.Value, value_type: QueryValueType.String, value: 'X-PRJ-1' },
  ],
};

const entry = (privileges: TableGrantKey[], over: Partial<TableAccessEntry> = {}): TableAccessEntry => ({
  privileges,
  rows: null,
  columns: null,
  ...over,
});

const READ_ENTRY = entry([TableGrantKey.Read]);

const config = (over: Partial<TableAccessConfig> = {}): TableAccessConfig => ({
  generation: 5,
  roles: { 'team-x': READ_ENTRY, 'ingest-bot': entry([TableGrantKey.Write]) },
  ineffective_grants: [],
  ...over,
});

const stored = (role: string, generation: number, saved: TableAccessEntry = READ_ENTRY): TableAccessEntryResult => ({
  ...saved,
  generation,
  role,
  ineffective_grants: [],
});

const everyoneWarning: IneffectiveGrant = {
  key: TableGrantKey.Read,
  role: '*',
  reason: IneffectiveGrantReason.EveryoneReadsAllRows,
  message: 'everyone reads every row',
};

const mockLoad = (over: Partial<TableAccessConfig> = {}) =>
  vi.mocked(getTableAccess).mockResolvedValue({ success: true, response: config(over) });

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
  test('reads the role-keyed access with one request and offers the tab with its rows', async () => {
    mockLoad({
      roles: { 'team-x': entry([TableGrantKey.Read], { rows: { filter }, columns: ['region'] }), '*': READ_ENTRY },
      ineffective_grants: [everyoneWarning],
    });

    const { result } = await renderLoaded();

    expect(getTableAccess).toHaveBeenCalledOnce();
    expect(getTableAccess).toHaveBeenCalledWith('events');
    expect(result.current.status).toBe(AccessStatus.Ready);
    expect(result.current.isTabOffered).toBe(true);
    expect(result.current.rows.map((row) => row.role)).toEqual(['*', 'team-x']);
    expect(result.current.rows[1]).toMatchObject({ rowsKind: RowsCellKind.Policy, columns: ['region'] });
    expect(result.current.rows[0].warnings).toEqual([everyoneWarning.message]);
    expect(result.current.roles['*']).toEqual(READ_ENTRY);
    expect(result.current.warnings).toEqual([everyoneWarning]);
  });

  test('requests nothing while disabled', async () => {
    const { result } = await renderLoaded(false);

    expect(getTableAccess).not.toHaveBeenCalled();
    expect(result.current.isTabOffered).toBe(false);
  });

  test('does not offer the tab while the read is in flight', () => {
    vi.mocked(getTableAccess).mockReturnValue(new Promise(() => undefined));

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

  test('notifies and keeps the tab offered when the access read fails otherwise', async () => {
    vi.mocked(getTableAccess).mockResolvedValue({ success: false, status: 500, errorHeader: 'boom' });

    const { result } = await renderLoaded();

    expect(result.current.status).toBe(AccessStatus.Failed);
    expect(result.current.isTabOffered).toBe(true);
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: AnalyticsTablesI18nKey.AccessLoadFailed }),
    );
  });

  test('titles a failed read without a header with its own string', async () => {
    vi.mocked(getTableAccess).mockResolvedValue({ success: false, status: 500 });

    await renderLoaded();

    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: AnalyticsTablesI18nKey.AccessLoadFailed }),
    );
  });
});

describe('useTableAccess — saveEntry', () => {
  const save = async (
    result: { current: ReturnType<typeof useTableAccess> },
    role: string,
    saved: TableAccessEntry = READ_ENTRY,
  ) => {
    let outcome: SaveEntryResult | undefined;
    await act(async () => {
      outcome = await result.current.saveEntry(role, saved);
    });

    return outcome;
  };

  test('sends the whole entry of one role with the generation that was read', async () => {
    const { result } = await renderLoaded();
    const saved = entry([TableGrantKey.Read], { rows: { filter }, columns: ['region'] });
    vi.mocked(putTableAccessEntry).mockResolvedValue({ success: true, response: stored('team-z', 6, saved) });

    const outcome = await save(result, 'team-z', saved);

    expect(putTableAccessEntry).toHaveBeenCalledOnce();
    expect(putTableAccessEntry).toHaveBeenCalledWith('events', 'team-z', { ...saved, generation: 5 });
    expect(outcome?.outcome).toBe(AccessChangeOutcome.Done);
  });

  test('sends the generation the previous save returned on the next save', async () => {
    const { result } = await renderLoaded();
    vi.mocked(getTableAccess).mockResolvedValue({ success: false, status: 500 });
    vi.mocked(putTableAccessEntry).mockResolvedValue({ success: true, response: stored('team-z', 6) });

    await save(result, 'team-z');
    await save(result, 'team-y');

    expect(putTableAccessEntry).toHaveBeenLastCalledWith('events', 'team-y', { ...READ_ENTRY, generation: 6 });
    expect(result.current.rows.map((row) => row.role)).toEqual(['ingest-bot', 'team-x', 'team-y', 'team-z']);
  });

  test('reads the access again after a successful save and shows what is now stored', async () => {
    const { result } = await renderLoaded();
    vi.mocked(putTableAccessEntry).mockResolvedValue({ success: true, response: stored('*', 6) });
    mockLoad({
      generation: 9,
      roles: { '*': READ_ENTRY, analysts: entry([TableGrantKey.Get]) },
      ineffective_grants: [everyoneWarning],
    });

    await save(result, '*');
    await save(result, 'team-y');

    expect(getTableAccess).toHaveBeenCalledTimes(3);
    expect(result.current.rows.map((row) => row.role)).toEqual(['*', 'analysts']);
    expect(result.current.warnings).toEqual([everyoneWarning]);
    expect(putTableAccessEntry).toHaveBeenLastCalledWith('events', 'team-y', { ...READ_ENTRY, generation: 9 });
  });

  test('hands back the service answer so the caller can show ineffective grants', async () => {
    const { result } = await renderLoaded();
    const answer = { ...stored('*', 6), ineffective_grants: [everyoneWarning] };
    vi.mocked(putTableAccessEntry).mockResolvedValue({ success: true, response: answer });

    const outcome = await save(result, '*');

    expect(outcome).toEqual({ outcome: AccessChangeOutcome.Done, result: answer });
  });

  test('drops a role whose stored entry came back with nothing left', async () => {
    const { result } = await renderLoaded();
    vi.mocked(getTableAccess).mockResolvedValue({ success: false, status: 500 });
    vi.mocked(putTableAccessEntry).mockResolvedValue({ success: true, response: stored('team-x', 6, entry([])) });

    await save(result, 'team-x', entry([]));

    expect(result.current.rows.map((row) => row.role)).toEqual(['ingest-bot']);
  });

  test('reports a conflict without an error notification and without reading again', async () => {
    const { result } = await renderLoaded();
    vi.mocked(putTableAccessEntry).mockResolvedValue({
      success: false,
      status: 409,
      errorHeader: 'access_conflict',
      errorMessage: 'changed by someone else',
    });

    const outcome = await save(result, 'team-x', entry([TableGrantKey.Modify]));

    expect(outcome).toEqual({ outcome: AccessChangeOutcome.Conflict });
    expect(showNotification).not.toHaveBeenCalled();
    expect(getTableAccess).toHaveBeenCalledOnce();
    expect(result.current.roles['team-x']).toEqual(READ_ENTRY);
  });

  test('notifies and reports failure when the save is refused, leaving the roles as they were', async () => {
    const { result } = await renderLoaded();
    vi.mocked(putTableAccessEntry).mockResolvedValue({
      success: false,
      status: 422,
      errorHeader: 'refused',
      errorMessage: 'region is not a column',
      requestId: 'req-1',
    });

    const outcome = await save(result, 'team-z');

    expect(outcome).toEqual({ outcome: AccessChangeOutcome.Failed, errorMessage: 'region is not a column' });
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: AnalyticsTableAccessI18nKey.SaveFailed,
        description: 'region is not a column',
        requestId: 'req-1',
      }),
    );
    expect(getTableAccess).toHaveBeenCalledOnce();
    expect(result.current.rows.map((row) => row.role)).not.toContain('team-z');
  });

  test('sends the same generation again after a busy answer', async () => {
    const { result } = await renderLoaded();
    vi.mocked(putTableAccessEntry).mockResolvedValueOnce({ success: false, status: 409, errorHeader: 'table_busy' });
    vi.mocked(putTableAccessEntry).mockResolvedValueOnce({ success: true, response: stored('team-z', 6) });

    const first = await save(result, 'team-z');
    const second = await save(result, 'team-z');

    expect(first?.outcome).toBe(AccessChangeOutcome.Failed);
    expect(second?.outcome).toBe(AccessChangeOutcome.Done);
    expect(putTableAccessEntry).toHaveBeenNthCalledWith(1, 'events', 'team-z', { ...READ_ENTRY, generation: 5 });
    expect(putTableAccessEntry).toHaveBeenNthCalledWith(2, 'events', 'team-z', { ...READ_ENTRY, generation: 5 });
  });

  test('uses the fallback title when a failed save carries none', async () => {
    const { result } = await renderLoaded();
    vi.mocked(putTableAccessEntry).mockResolvedValue({ success: false, status: 500 });

    await save(result, 'team-z');

    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: AnalyticsTableAccessI18nKey.SaveFailed }),
    );
  });
});

describe('useTableAccess — removeRole', () => {
  const remove = async (result: { current: ReturnType<typeof useTableAccess> }, role: string) => {
    let outcome: AccessChangeOutcome | undefined;
    await act(async () => {
      outcome = await result.current.removeRole(role);
    });

    return outcome;
  };

  test('sends one delete with the generation that was read, then reads the access again', async () => {
    const { result } = await renderLoaded();
    vi.mocked(deleteTableAccessEntry).mockResolvedValue({ success: true });
    mockLoad({ generation: 6, roles: { 'ingest-bot': entry([TableGrantKey.Write]) } });

    const outcome = await remove(result, 'team-x');

    expect(deleteTableAccessEntry).toHaveBeenCalledOnce();
    expect(deleteTableAccessEntry).toHaveBeenCalledWith('events', 'team-x', 5);
    expect(getTableAccess).toHaveBeenCalledTimes(2);
    expect(outcome).toBe(AccessChangeOutcome.Done);
    expect(result.current.rows.map((row) => row.role)).toEqual(['ingest-bot']);
  });

  test('drops the role even when the read after the removal fails', async () => {
    const { result } = await renderLoaded();
    vi.mocked(deleteTableAccessEntry).mockResolvedValue({ success: true });
    vi.mocked(getTableAccess).mockResolvedValue({ success: false, status: 500 });

    const outcome = await remove(result, 'team-x');

    expect(outcome).toBe(AccessChangeOutcome.Done);
    expect(result.current.rows.map((row) => row.role)).toEqual(['ingest-bot']);
  });

  test('notifies, reads the access again and reports a conflict when the role was changed', async () => {
    const { result } = await renderLoaded();
    vi.mocked(deleteTableAccessEntry).mockResolvedValue({
      success: false,
      status: 409,
      errorHeader: 'access_conflict',
      errorMessage: 'changed by someone else',
      requestId: 'req-2',
    });
    mockLoad({ generation: 8, roles: { 'team-x': entry([TableGrantKey.Modify]) } });

    const outcome = await remove(result, 'team-x');

    expect(outcome).toBe(AccessChangeOutcome.Conflict);
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'changed by someone else', requestId: 'req-2' }),
    );
    expect(getTableAccess).toHaveBeenCalledTimes(2);
    expect(result.current.roles['team-x']).toEqual(entry([TableGrantKey.Modify]));
  });

  test('notifies and reports failure without reading again when the removal fails otherwise', async () => {
    const { result } = await renderLoaded();
    vi.mocked(deleteTableAccessEntry).mockResolvedValue({ success: false, status: 500 });

    const outcome = await remove(result, 'team-x');

    expect(outcome).toBe(AccessChangeOutcome.Failed);
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: AnalyticsTableAccessI18nKey.RemoveFailed }),
    );
    expect(getTableAccess).toHaveBeenCalledOnce();
    expect(result.current.rows.map((row) => row.role)).toContain('team-x');
  });
});

describe('useTableAccess — reload', () => {
  test('returns the configuration it read and shows it', async () => {
    const { result } = await renderLoaded();
    const next = config({ generation: 9, roles: { analysts: entry([TableGrantKey.Get]) } });
    vi.mocked(getTableAccess).mockResolvedValue({ success: true, response: next });

    let read: TableAccessConfig | null | undefined;
    await act(async () => {
      read = await result.current.reload();
    });

    expect(read).toEqual(next);
    expect(result.current.rows.map((row) => row.role)).toEqual(['analysts']);
  });

  test('notifies and returns nothing when the read fails, keeping what was shown', async () => {
    const { result } = await renderLoaded();
    vi.mocked(getTableAccess).mockResolvedValue({ success: false, status: 500 });

    let read: TableAccessConfig | null | undefined;
    await act(async () => {
      read = await result.current.reload();
    });

    expect(read).toBeNull();
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: AnalyticsTablesI18nKey.AccessLoadFailed }),
    );
    expect(result.current.rows.map((row) => row.role)).toEqual(['ingest-bot', 'team-x']);
  });
});
