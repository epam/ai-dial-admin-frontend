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
    expect(newHref).toBe('/adapters/222');

    newHref = getRollbackRedirectHref(ActivityAuditResourceType.ROLE, '333');
    expect(newHref).toBe('/roles/333');

    newHref = getRollbackRedirectHref(ActivityAuditResourceType.KEY, '444');
    expect(newHref).toBe('/keys/444');
  });

  test('returns ActivityAudit page href for unknow entity type or empty resource id', () => {
    let newHref = getRollbackRedirectHref(undefined, '444');
    expect(newHref).toBe('/activity-audit');
  });

  test('returns container detail route for each deployment resource type', () => {
    expect(getRollbackRedirectHref(ActivityAuditResourceType.ADAPTER_DEPLOYMENT, 'a1')).toBe('/adapter-containers/a1');
    expect(getRollbackRedirectHref(ActivityAuditResourceType.APPLICATION_DEPLOYMENT, 'b2')).toBe(
      '/application-containers/b2',
    );
    expect(getRollbackRedirectHref(ActivityAuditResourceType.INTERCEPTOR_DEPLOYMENT, 'c3')).toBe(
      '/interceptor-containers/c3',
    );
    expect(getRollbackRedirectHref(ActivityAuditResourceType.MCP_DEPLOYMENT, 'd4')).toBe('/mcp-containers/d4');
    expect(getRollbackRedirectHref(ActivityAuditResourceType.NIM_DEPLOYMENT, 'e5')).toBe('/model-servings/e5');
    expect(getRollbackRedirectHref(ActivityAuditResourceType.INFERENCE_DEPLOYMENT, 'f6')).toBe('/model-servings/f6');
  });

  test('returns Images detail route for each image-definition resource type', () => {
    expect(getRollbackRedirectHref(ActivityAuditResourceType.ADAPTER_IMAGE_DEFINITION, 'g7')).toBe(
      '/deployment-images/g7',
    );
    expect(getRollbackRedirectHref(ActivityAuditResourceType.APPLICATION_IMAGE_DEFINITION, 'h8')).toBe(
      '/deployment-images/h8',
    );
    expect(getRollbackRedirectHref(ActivityAuditResourceType.INTERCEPTOR_IMAGE_DEFINITION, 'i9')).toBe(
      '/deployment-images/i9',
    );
    expect(getRollbackRedirectHref(ActivityAuditResourceType.MCP_IMAGE_DEFINITION, 'j10')).toBe(
      '/deployment-images/j10',
    );
  });

  test('falls back to ActivityAudit for image-build domain whitelist (no entity page)', () => {
    expect(getRollbackRedirectHref(ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST, 'whatever')).toBe(
      '/activity-audit',
    );
  });
});
