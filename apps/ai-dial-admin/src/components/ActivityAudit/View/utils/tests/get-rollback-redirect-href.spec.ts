import { describe, test, expect } from 'vitest';
import { getRollbackRedirectHref } from '../get-rollback-redirect-href';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';

describe('getRollbackRedirectHref', () => {
  test('returns correct redirect href for entity', () => {
    let newHref = getRollbackRedirectHref(ActivityAuditResourceType.MODEL, '123');
    expect(newHref).toBe('/models/123?tab=Audit&subtab=Activities');

    newHref = getRollbackRedirectHref(ActivityAuditResourceType.APPLICATION, '456');
    expect(newHref).toBe('/applications/456?tab=Audit&subtab=Activities');

    newHref = getRollbackRedirectHref(ActivityAuditResourceType.TOOLSET, '789');
    expect(newHref).toBe('/toolsets/789?tab=Audit&subtab=Activities');

    newHref = getRollbackRedirectHref(ActivityAuditResourceType.INTERCEPTOR, '321');
    expect(newHref).toBe('/interceptors/321?tab=Audit&subtab=Activities');

    newHref = getRollbackRedirectHref(ActivityAuditResourceType.ROUTE, '654');
    expect(newHref).toBe('/routes/654?tab=Audit&subtab=Activities');

    newHref = getRollbackRedirectHref(ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA, '987');
    expect(newHref).toBe('/application-runners/987?tab=Audit&subtab=Activities');

    newHref = getRollbackRedirectHref(ActivityAuditResourceType.INTERCEPTOR_TEMPLATE, '111');
    expect(newHref).toBe('/interceptor-templates/111?tab=Audit&subtab=Activities');

    newHref = getRollbackRedirectHref(ActivityAuditResourceType.ADAPTER, '222');
    expect(newHref).toBe('/adapters/222?tab=Audit&subtab=Activities');

    newHref = getRollbackRedirectHref(ActivityAuditResourceType.ROLE, '333');
    expect(newHref).toBe('/roles/333?tab=Audit&subtab=Activities');

    newHref = getRollbackRedirectHref(ActivityAuditResourceType.KEY, '444');
    expect(newHref).toBe('/keys/444?tab=Audit&subtab=Activities');
  });

  test('returns ActivityAudit page href for unknow entity type or empty resource id', () => {
    let newHref = getRollbackRedirectHref(undefined, '444');
    expect(newHref).toBe('/activity-audit');
  });
});
