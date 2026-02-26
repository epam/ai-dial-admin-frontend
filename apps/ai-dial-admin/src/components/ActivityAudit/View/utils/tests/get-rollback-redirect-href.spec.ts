import { describe, test, expect } from 'vitest';
import { getRollbackRedirectHref } from '../get-rollback-redirect-href';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';

describe('getRollbackRedirectHref', () => {
  test('returns correct redirect href for entity', () => {
    let newHref = getRollbackRedirectHref(ActivityAuditResourceType.MODEL, '123');
    expect(newHref).toBe('/models/123');

    newHref = getRollbackRedirectHref(ActivityAuditResourceType.APPLICATION, '456');
    expect(newHref).toBe('/applications/456');

    newHref = getRollbackRedirectHref(ActivityAuditResourceType.TOOLSET, '789');
    expect(newHref).toBe('/toolsets/789');

    newHref = getRollbackRedirectHref(ActivityAuditResourceType.INTERCEPTOR, '321');
    expect(newHref).toBe('/interceptors/321');

    newHref = getRollbackRedirectHref(ActivityAuditResourceType.ROUTE, '654');
    expect(newHref).toBe('/routes/654');

    newHref = getRollbackRedirectHref(ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA, '987');
    expect(newHref).toBe('/application-runners/987');

    newHref = getRollbackRedirectHref(ActivityAuditResourceType.INTERCEPTOR_TEMPLATE, '111');
    expect(newHref).toBe('/interceptor-templates/111');

    newHref = getRollbackRedirectHref(ActivityAuditResourceType.ADAPTER, '222');
    expect(newHref).toBe('/adapters/s');

    newHref = getRollbackRedirectHref(ActivityAuditResourceType.ROLE, '333');
    expect(newHref).toBe('/roles/333');

    newHref = getRollbackRedirectHref(ActivityAuditResourceType.KEY, '444');
    expect(newHref).toBe('/keys/444');
  });

  test('returns ActivityAudit page href for unknow entity type or empty resource id', () => {
    let newHref = getRollbackRedirectHref(undefined, '444');
    expect(newHref).toBe('/activity-audit');
  });
});
