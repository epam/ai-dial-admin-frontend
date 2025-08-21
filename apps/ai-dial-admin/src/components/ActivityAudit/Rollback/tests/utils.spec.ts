import { KEYS_COLUMNS, RUNNERS_COLUMNS, SIMPLE_ENTITY_COLUMNS } from '@/src/constants/grid-columns/grid-columns';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { describe, expect, test } from 'vitest';
import { getSystemRollbackColumns } from '../utils';

describe('getSystemRollbackColumns', () => {
  const t = (s: string) => `t:${s}`;

  test('returns SIMPLE_ENTITY_COLUMNS for ADAPTER', () => {
    const cols = getSystemRollbackColumns(ActivityAuditResourceType.ADAPTER, t);
    expect(cols).toEqual(SIMPLE_ENTITY_COLUMNS);
  });

  test('returns SIMPLE_ENTITY_COLUMNS for INTERCEPTOR', () => {
    const cols = getSystemRollbackColumns(ActivityAuditResourceType.INTERCEPTOR, t);
    expect(cols).toEqual(SIMPLE_ENTITY_COLUMNS);
  });

  test('returns SIMPLE_ENTITY_COLUMNS for ROLE', () => {
    const cols = getSystemRollbackColumns(ActivityAuditResourceType.ROLE, t);
    expect(cols).toEqual(SIMPLE_ENTITY_COLUMNS);
  });

  test('returns SIMPLE_ENTITY_COLUMNS for ROUTE', () => {
    const cols = getSystemRollbackColumns(ActivityAuditResourceType.ROUTE, t);
    expect(cols).toEqual(SIMPLE_ENTITY_COLUMNS);
  });

  test('returns KEYS_COLUMNS for KEY', () => {
    const cols = getSystemRollbackColumns(ActivityAuditResourceType.KEY, t);
    expect(cols).toEqual(KEYS_COLUMNS);
  });

  test('returns RUNNERS_COLUMNS for APPLICATION_TYPE_SCHEMA', () => {
    const cols = getSystemRollbackColumns(ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA, t);
    expect(cols).toEqual(RUNNERS_COLUMNS);
  });

  test('returns empty array for unknown type', () => {
    const cols = getSystemRollbackColumns(ActivityAuditResourceType.UNKNOWN as any, t);
    expect(cols).toEqual([]);
  });
});
