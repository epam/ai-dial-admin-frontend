import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { describe, expect, test } from 'vitest';
import { getCreateAction, getDeleteAction, getUpdateAction } from '../get-rollback-request';

describe('getUpdateAction', () => {
  test('returns correct update function for MODEL', () => {
    expect(getUpdateAction(ActivityAuditResourceType.MODEL).name).toBe('updateModel');
  });
  test('returns null for unknown type', () => {
    expect(getUpdateAction('Unknown')).toBeNull();
  });
});

describe('getCreateAction', () => {
  test('returns correct create function for APPLICATION', () => {
    expect(getCreateAction(ActivityAuditResourceType.APPLICATION)?.name).toBe('createApplication');
  });
  test('returns null for unknown type', () => {
    expect(getCreateAction('Unknown')).toBeNull();
  });
});

describe('getDeleteAction', () => {
  test('returns correct delete function for KEY', () => {
    expect(getDeleteAction(ActivityAuditResourceType.KEY)?.name).toBe('removeKey');
  });
  test('returns null for unknown type', () => {
    expect(getDeleteAction('Unknown')).toBeNull();
  });
});
