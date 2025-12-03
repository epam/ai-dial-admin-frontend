import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { describe, expect, test } from 'vitest';
import { getCreateAction, getDeleteAction, getUpdateAction } from '../get-rollback-request';

describe('getUpdateAction', () => {
  test('returns correct update function for entities', () => {
    expect(getUpdateAction(ActivityAuditResourceType.MODEL).name).toBe('updateModel');
    expect(getUpdateAction(ActivityAuditResourceType.APPLICATION).name).toBe('updateApplication');
    expect(getUpdateAction(ActivityAuditResourceType.ADAPTER).name).toBe('updateAdapter');
    expect(getUpdateAction(ActivityAuditResourceType.INTERCEPTOR).name).toBe('updateInterceptor');
    expect(getUpdateAction(ActivityAuditResourceType.KEY).name).toBe('updateKey');
    expect(getUpdateAction(ActivityAuditResourceType.ROLE).name).toBe('updateRole');
    expect(getUpdateAction(ActivityAuditResourceType.ROUTE).name).toBe('updateRoute');
    expect(getUpdateAction(ActivityAuditResourceType.TOOLSET).name).toBe('updateToolset');
    expect(getUpdateAction(ActivityAuditResourceType.INTERCEPTOR_TEMPLATE).name).toBe('updateInterceptorTemplate');
    expect(getUpdateAction(ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA).name).toBe('updateApplicationScheme');
  });
  test('returns null for unknown type', () => {
    expect(getUpdateAction('Unknown')).toBeNull();
  });
});

describe('getCreateAction', () => {
  test('returns correct create function for entities', () => {
    expect(getCreateAction(ActivityAuditResourceType.MODEL)?.name).toBe('createModel');
    expect(getCreateAction(ActivityAuditResourceType.APPLICATION)?.name).toBe('createApplication');
    expect(getCreateAction(ActivityAuditResourceType.ADAPTER)?.name).toBe('createAdapter');
    expect(getCreateAction(ActivityAuditResourceType.INTERCEPTOR)?.name).toBe('createInterceptor');
    expect(getCreateAction(ActivityAuditResourceType.KEY)?.name).toBe('createKey');
    expect(getCreateAction(ActivityAuditResourceType.ROLE)?.name).toBe('createRole');
    expect(getCreateAction(ActivityAuditResourceType.ROUTE)?.name).toBe('createRoute');
    expect(getCreateAction(ActivityAuditResourceType.TOOLSET)?.name).toBe('createToolset');
    expect(getCreateAction(ActivityAuditResourceType.INTERCEPTOR_TEMPLATE)?.name).toBe('createInterceptorTemplate');
    expect(getCreateAction(ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA)?.name).toBe('createApplicationScheme');
  });
  test('returns null for unknown type', () => {
    expect(getCreateAction('Unknown')).toBeNull();
  });
});

describe('getDeleteAction', () => {
  test('returns correct delete function for entities', () => {
    expect(getDeleteAction(ActivityAuditResourceType.MODEL)?.name).toBe('removeModel');
    expect(getDeleteAction(ActivityAuditResourceType.APPLICATION)?.name).toBe('removeApplication');
    expect(getDeleteAction(ActivityAuditResourceType.ADAPTER)?.name).toBe('removeAdapter');
    expect(getDeleteAction(ActivityAuditResourceType.INTERCEPTOR)?.name).toBe('removeInterceptor');
    expect(getDeleteAction(ActivityAuditResourceType.KEY)?.name).toBe('removeKey');
    expect(getDeleteAction(ActivityAuditResourceType.ROLE)?.name).toBe('removeRole');
    expect(getDeleteAction(ActivityAuditResourceType.ROUTE)?.name).toBe('removeRoute');
    expect(getDeleteAction(ActivityAuditResourceType.TOOLSET)?.name).toBe('removeToolset');
    expect(getDeleteAction(ActivityAuditResourceType.INTERCEPTOR_TEMPLATE)?.name).toBe('deleteInterceptorTemplate');
    expect(getDeleteAction(ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA)?.name).toBe('removeApplicationScheme');
  });
  test('returns null for unknown type', () => {
    expect(getDeleteAction('Unknown')).toBeNull();
  });
});
