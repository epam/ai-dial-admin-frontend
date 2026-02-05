import { KEYS_COLUMNS, LIST_RUNNER_COLUMNS, BASE_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import { getSystemRollbackColumns } from '../utils';

describe('getSystemRollbackColumns', () => {
  const t = (s: string) => `t:${s}`;
  const view = ApplicationRoute.Models;

  test('returns BASE_COLUMNS for ADAPTER', () => {
    const cols = getSystemRollbackColumns(ActivityAuditResourceType.ADAPTER, t);
    expect(cols).toEqual(BASE_COLUMNS);
  });

  test('returns BASE_COLUMNS for INTERCEPTOR', () => {
    const cols = getSystemRollbackColumns(ActivityAuditResourceType.INTERCEPTOR, t);
    expect(cols).toEqual(BASE_COLUMNS);
  });

  test('returns BASE_COLUMNS for ROLE', () => {
    const cols = getSystemRollbackColumns(ActivityAuditResourceType.ROLE, t);
    expect(cols).toEqual(BASE_COLUMNS);
  });

  test('returns BASE_COLUMNS for ROUTE', () => {
    const cols = getSystemRollbackColumns(ActivityAuditResourceType.ROUTE, t);
    expect(cols).toEqual(BASE_COLUMNS);
  });

  test('returns BASE_COLUMNS for TOOLSET', () => {
    const cols = getSystemRollbackColumns(ActivityAuditResourceType.TOOLSET, t);
    expect(cols).toEqual(BASE_COLUMNS);
  });

  test('returns BASE_COLUMNS for MODEL', () => {
    const cols = getSystemRollbackColumns(ActivityAuditResourceType.MODEL, t);
    expect(cols.length).toEqual(17);
  });

  test('returns BASE_COLUMNS for APPLICATION', () => {
    const cols = getSystemRollbackColumns(ActivityAuditResourceType.APPLICATION, t);
    expect(cols.length).toEqual(10);
  });

  test('returns BASE_COLUMNS for INTERCEPTOR TEMPLATE', () => {
    const cols = getSystemRollbackColumns(ActivityAuditResourceType.INTERCEPTOR_TEMPLATE, t);
    expect(cols).toEqual(BASE_COLUMNS);
  });

  test('returns KEYS_COLUMNS for KEY', () => {
    const res = KEYS_COLUMNS(t);
    const cols = getSystemRollbackColumns(ActivityAuditResourceType.KEY, t);
    expect(cols.length).toEqual(res.length);
  });

  test('returns LIST_RUNNER_COLUMNS for APPLICATION_TYPE_SCHEMA', () => {
    const cols = getSystemRollbackColumns(ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA, t);
    expect(cols).toEqual(LIST_RUNNER_COLUMNS);
  });

  test('returns empty array for unknown type', () => {
    const cols = getSystemRollbackColumns(ActivityAuditResourceType.UNKNOWN as any, t);
    expect(cols).toEqual([]);
  });
});
