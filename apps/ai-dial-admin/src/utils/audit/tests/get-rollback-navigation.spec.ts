import { ActivityAuditResourceType, ActivityAuditType, ActivityAuditView } from '@/src/types/activity-audit';
import { describe, expect, test } from 'vitest';
import { getRollbackNavigation, RollbackRedirectTarget } from '../get-rollback-navigation';

const MODEL = ActivityAuditResourceType.MODEL;
const CONTAINER = ActivityAuditResourceType.MCP_DEPLOYMENT;
const WHITELIST = ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST;

describe('getRollbackNavigation', () => {
  test('Create from audit → audit list with the matching view', () => {
    const nav = getRollbackNavigation(ActivityAuditType.Create, CONTAINER, 'svc', false);
    expect(nav.target).toBe(RollbackRedirectTarget.AuditList);
    expect(nav.auditView).toBe(ActivityAuditView.Deployments);
  });

  test('Create from audit (admin) → audit list with Config view', () => {
    const nav = getRollbackNavigation(ActivityAuditType.Create, MODEL, '123', false);
    expect(nav.target).toBe(RollbackRedirectTarget.AuditList);
    expect(nav.auditView).toBe(ActivityAuditView.Config);
  });

  test('Create from entity tab → entity list', () => {
    const nav = getRollbackNavigation(ActivityAuditType.Create, CONTAINER, 'svc', true);
    expect(nav.target).toBe(RollbackRedirectTarget.EntityList);
    expect(nav.entityListHref).toBe('/mcp-containers');
  });

  test('Delete → entity detail page (both contexts)', () => {
    expect(getRollbackNavigation(ActivityAuditType.Delete, CONTAINER, 'svc', false).target).toBe(
      RollbackRedirectTarget.EntityDetail,
    );
    const nav = getRollbackNavigation(ActivityAuditType.Delete, CONTAINER, 'svc', true);
    expect(nav.target).toBe(RollbackRedirectTarget.EntityDetail);
    expect(nav.entityDetailHref).toBe('/mcp-containers/svc');
  });

  test('Delete recreate uses the new id from the create response (image definitions)', () => {
    const image = ActivityAuditResourceType.MCP_IMAGE_DEFINITION;
    // old resourceId in the activity is stale; backend assigns a fresh id on recreate
    const nav = getRollbackNavigation(ActivityAuditType.Delete, image, 'old-id', false, { id: 'new-id' });
    expect(nav.target).toBe(RollbackRedirectTarget.EntityDetail);
    expect(nav.entityDetailHref).toBe('/deployment-images/new-id');
  });

  test('Delete recreate resolves containers by name from the response', () => {
    const nav = getRollbackNavigation(ActivityAuditType.Delete, CONTAINER, 'svc', false, { name: 'svc' });
    expect(nav.entityDetailHref).toBe('/mcp-containers/svc');
  });

  test('Update from audit → audit list', () => {
    expect(getRollbackNavigation(ActivityAuditType.Update, CONTAINER, 'svc', false).target).toBe(
      RollbackRedirectTarget.AuditList,
    );
  });

  test('Update from entity tab → refresh', () => {
    expect(getRollbackNavigation(ActivityAuditType.Update, CONTAINER, 'svc', true).target).toBe(
      RollbackRedirectTarget.Refresh,
    );
  });

  test('Delete falls back when the type has no entity route (whitelist) → audit list / refresh', () => {
    expect(getRollbackNavigation(ActivityAuditType.Delete, WHITELIST, '1', false).target).toBe(
      RollbackRedirectTarget.AuditList,
    );
    expect(getRollbackNavigation(ActivityAuditType.Delete, WHITELIST, '1', true).target).toBe(
      RollbackRedirectTarget.Refresh,
    );
  });

  test('Create from entity tab falls back to audit list when no entity route', () => {
    expect(getRollbackNavigation(ActivityAuditType.Create, WHITELIST, '1', true).target).toBe(
      RollbackRedirectTarget.AuditList,
    );
  });
});
