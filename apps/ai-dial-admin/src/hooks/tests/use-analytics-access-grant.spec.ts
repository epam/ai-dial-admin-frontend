import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getTables } from '@/src/app/[lang]/tables/actions';
import { useAnalyticsAccessGrant } from '@/src/hooks/use-analytics-access-grant';
import { AnalyticsTable, AnalyticsTableType, TablePermissions } from '@/src/models/analytics/table';
import { appContextMock } from '@/test-mocks/app-context';

vi.mock('@/src/app/[lang]/tables/actions', () => ({ getTables: vi.fn() }));

const permissions = (grant?: boolean): TablePermissions => ({
  get: true,
  read: true,
  sensitive: false,
  write: false,
  modify: false,
  rows_restricted: false,
  grant,
});

const table = (over: Partial<AnalyticsTable> = {}): AnalyticsTable => ({
  name: 'dial_usage_log',
  type: AnalyticsTableType.Source,
  system: true,
  ...over,
});

describe('useAnalyticsAccessGrant', () => {
  beforeEach(() => {
    appContextMock.set({ isEnableAuth: true });
  });

  test('reports the grant permission the table listing carries', async () => {
    vi.mocked(getTables).mockResolvedValue({ success: true, response: [table({ permissions: permissions(true) })] });

    const { result } = renderHook(() => useAnalyticsAccessGrant(true));

    await waitFor(() => expect(result.current).toBe(true));
  });

  test('stays false when the listing denies the grant permission', async () => {
    vi.mocked(getTables).mockResolvedValue({ success: true, response: [table({ permissions: permissions(false) })] });

    const { result } = renderHook(() => useAnalyticsAccessGrant(true));

    await vi.waitFor(() => expect(getTables).toHaveBeenCalledOnce());
    expect(result.current).toBe(false);
  });

  test('allows access when the listing omits permissions and auth is disabled', async () => {
    appContextMock.set({ isEnableAuth: false });
    vi.mocked(getTables).mockResolvedValue({ success: true, response: [table()] });

    const { result } = renderHook(() => useAnalyticsAccessGrant(true));

    await waitFor(() => expect(result.current).toBe(true));
  });

  test('stays false when the listing cannot be read', async () => {
    appContextMock.set({ isEnableAuth: false });
    vi.mocked(getTables).mockRejectedValue(new Error('fetch failed'));

    const { result } = renderHook(() => useAnalyticsAccessGrant(true));

    await vi.waitFor(() => expect(getTables).toHaveBeenCalledOnce());
    expect(result.current).toBe(false);
  });

  test('reads nothing while inactive', () => {
    const { result } = renderHook(() => useAnalyticsAccessGrant(false));

    expect(result.current).toBe(false);
    expect(getTables).not.toHaveBeenCalled();
  });
});
