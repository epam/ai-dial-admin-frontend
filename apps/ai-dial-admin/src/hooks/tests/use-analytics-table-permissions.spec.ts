import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// Override the global AppContext mock with a mutable context for this file.
const ctx = { isFullAdmin: false, isEnableAuth: true };
vi.mock('@/src/context/AppContext', () => ({ useAppContext: () => ctx }));

import { useAnalyticsTablePermissions } from '@/src/hooks/use-analytics-table-permissions';
import { AnalyticsTable, AnalyticsTableType, TablePermissions } from '@/src/models/analytics/table';

const table = (over: Partial<AnalyticsTable> = {}): AnalyticsTable => ({
  name: 't',
  type: AnalyticsTableType.Source,
  ...over,
});

const perms = (write: boolean, modify: boolean): TablePermissions => ({ write, modify });

beforeEach(() => {
  ctx.isFullAdmin = false;
  ctx.isEnableAuth = true;
});

describe('useAnalyticsTablePermissions', () => {
  test('full admin on a fully-permitted table can do everything', () => {
    ctx.isFullAdmin = true;
    const { result } = renderHook(() => useAnalyticsTablePermissions(table({ permissions: perms(true, true) })));
    expect(result.current).toEqual({
      canCreate: true,
      canDelete: true,
      canManageRoles: true,
      canWrite: true,
      canModify: true,
    });
  });

  test('non-admin with no table role is read-only', () => {
    const { result } = renderHook(() => useAnalyticsTablePermissions(table({ permissions: perms(false, false) })));
    expect(result.current).toEqual({
      canCreate: false,
      canDelete: false,
      canManageRoles: false,
      canWrite: false,
      canModify: false,
    });
  });

  test('per-table modify without write', () => {
    const { result } = renderHook(() => useAnalyticsTablePermissions(table({ permissions: perms(false, true) })));
    expect(result.current.canWrite).toBe(false);
    expect(result.current.canModify).toBe(true);
  });

  test('per-table write without modify', () => {
    const { result } = renderHook(() => useAnalyticsTablePermissions(table({ permissions: perms(true, false) })));
    expect(result.current.canWrite).toBe(true);
    expect(result.current.canModify).toBe(false);
  });

  test('system table: delete and manage roles are false even for a full admin', () => {
    ctx.isFullAdmin = true;
    const { result } = renderHook(() =>
      useAnalyticsTablePermissions(table({ system: true, permissions: perms(false, false) })),
    );
    expect(result.current.canDelete).toBe(false);
    expect(result.current.canWrite).toBe(false);
    expect(result.current.canModify).toBe(false);
    expect(result.current.canManageRoles).toBe(false);
  });

  test('missing permissions default to read-only when auth is enabled', () => {
    const { result } = renderHook(() => useAnalyticsTablePermissions(table()));
    expect(result.current.canWrite).toBe(false);
    expect(result.current.canModify).toBe(false);
  });

  test('auth disabled opens everything even without permissions', () => {
    ctx.isEnableAuth = false;
    ctx.isFullAdmin = true; // auth off resolves isFullAdmin true in the provider
    const { result } = renderHook(() => useAnalyticsTablePermissions(table()));
    expect(result.current).toEqual({
      canCreate: true,
      canDelete: true,
      canManageRoles: true,
      canWrite: true,
      canModify: true,
    });
  });

  test('no table (catalog level) uses the admin flags', () => {
    ctx.isFullAdmin = true;
    const { result } = renderHook(() => useAnalyticsTablePermissions());
    expect(result.current.canCreate).toBe(true);
    expect(result.current.canDelete).toBe(true);
  });
});
