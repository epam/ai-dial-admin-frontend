import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { describe, expect, test } from 'vitest';
import { getRevisionRouteForAllEntities, getRevisionRouteForEntityType } from '../get-revision-route';

describe('Audit :: getRevisionRouteForEntityType', () => {
  const id = '12345';

  test('returns correct route for MODEL', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.MODEL, id)).toBe(`/models/${id}/revision/`);
  });

  test('returns correct route for APPLICATION', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.APPLICATION, id)).toBe(
      `/applications/${id}/revision/`,
    );
  });

  test('returns correct route for ADAPTER', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.ADAPTER, id)).toBe(`/adapters/${id}/revision/`);
  });

  test('returns correct route for INTERCEPTOR_TEMPLATE', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.INTERCEPTOR_TEMPLATE, id)).toBe(
      `/interceptor-runners/${id}/revision/`,
    );
  });

  test('returns correct route for INTERCEPTOR', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.INTERCEPTOR, id)).toBe(
      `/interceptors/${id}/revision/`,
    );
  });

  test('returns correct route for KEY', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.KEY, id)).toBe(`/keys/${id}/revision/`);
  });

  test('returns correct route for ROLE', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.ROLE, id)).toBe(`/roles/${id}/revision/`);
  });

  test('returns correct route for ROUTE', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.ROUTE, id)).toBe(`/routes/${id}/revision/`);
  });

  test('returns correct route for TOOLSET', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.TOOLSET, id)).toBe(`/toolSets/${id}/revision/`);
  });

  test('returns correct route for APPLICATION_TYPE_SCHEMA', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA, id)).toBe(
      `/applicationTypeSchemas/snapshot?id=${id}&revision=`,
    );
  });

  test('returns correct route for SYSTEM_PROPERTIES', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.SYSTEM_PROPERTIES, id)).toBe(
      `/global-settings/revision/`,
    );
  });

  test.each([
    ActivityAuditResourceType.ADAPTER_IMAGE_DEFINITION,
    ActivityAuditResourceType.APPLICATION_IMAGE_DEFINITION,
    ActivityAuditResourceType.INTERCEPTOR_IMAGE_DEFINITION,
    ActivityAuditResourceType.MCP_IMAGE_DEFINITION,
  ])('returns correct route for %s', (type) => {
    expect(getRevisionRouteForEntityType(type, id)).toBe(`/images/definitions/${id}/revision/`);
  });

  test('returns correct route for IMAGE_BUILD_DOMAIN_WHITELIST (no id segment)', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.IMAGE_BUILD_DOMAIN_WHITELIST, id)).toBe(
      `/global-whitelist/image-build/revision/`,
    );
  });

  test.each([
    ActivityAuditResourceType.ADAPTER_DEPLOYMENT,
    ActivityAuditResourceType.APPLICATION_DEPLOYMENT,
    ActivityAuditResourceType.INTERCEPTOR_DEPLOYMENT,
    ActivityAuditResourceType.MCP_DEPLOYMENT,
    ActivityAuditResourceType.NIM_DEPLOYMENT,
    ActivityAuditResourceType.INFERENCE_DEPLOYMENT,
  ])('returns correct route for %s', (type) => {
    expect(getRevisionRouteForEntityType(type, id)).toBe(`/deployments/${id}/revision/`);
  });

  test('returns correct route for TABLE', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.TABLE, 'orders')).toBe(`/tables/orders/revision/`);
  });

  test('returns the owning table route for TABLE_COLUMN', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.TABLE_COLUMN, 'orders:total')).toBe(
      `/tables/orders/revision/`,
    );
  });

  test('returns correct route for PIPELINE', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.PIPELINE, 'daily_rollup')).toBe(
      `/pipelines/daily_rollup/revision/`,
    );
  });

  test('returns correct route for SAVED_QUERY', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.SAVED_QUERY, 'q1')).toBe(
      `/saved-queries/q1/revision/`,
    );
  });

  // Documents the URL each analytics route becomes once the resolver appends the revision
  // and the analytics client prefixes `v1`. The prefix is asserted against the client in
  // src/server/analytics/tests/audit-api.spec.ts; this pins only this function's half.
  test.each([
    [ActivityAuditResourceType.TABLE, 'orders', 7, 'v1/tables/orders/revision/7'],
    [ActivityAuditResourceType.TABLE_COLUMN, 'orders:total', 7, 'v1/tables/orders/revision/7'],
    [ActivityAuditResourceType.PIPELINE, 'daily_rollup', 3, 'v1/pipelines/daily_rollup/revision/3'],
    [ActivityAuditResourceType.SAVED_QUERY, 'q1', 3, 'v1/saved-queries/q1/revision/3'],
  ])('documents the analytics snapshot url composed for %s', (type, resourceId, revision, expected) => {
    expect(`v1${getRevisionRouteForEntityType(type, resourceId)}${revision}`).toBe(expected);
  });

  test('returns null for unknown type', () => {
    expect(getRevisionRouteForEntityType('UNKNOWN' as any, id)).toBeNull();
  });

  test('returns null when type is undefined', () => {
    expect(getRevisionRouteForEntityType(undefined, id)).toBeNull();
  });
});

describe('Audit :: getRevisionRouteForAllEntities', () => {
  const id = '12345';

  test('returns correct route for MODEL', () => {
    expect(getRevisionRouteForAllEntities(ActivityAuditResourceType.MODEL)).toBe(`/models/revision/`);
  });

  test('returns correct route for APPLICATION', () => {
    expect(getRevisionRouteForAllEntities(ActivityAuditResourceType.APPLICATION)).toBe(`/applications/revision/`);
  });

  test('returns correct route for ADAPTER', () => {
    expect(getRevisionRouteForAllEntities(ActivityAuditResourceType.ADAPTER)).toBe(`/adapters/revision/`);
  });

  test('returns correct route for INTERCEPTOR', () => {
    expect(getRevisionRouteForAllEntities(ActivityAuditResourceType.INTERCEPTOR)).toBe(`/interceptors/revision/`);
  });

  test('returns correct route for KEY', () => {
    expect(getRevisionRouteForAllEntities(ActivityAuditResourceType.KEY)).toBe(`/keys/revision/`);
  });

  test('returns correct route for TOOLSET', () => {
    expect(getRevisionRouteForAllEntities(ActivityAuditResourceType.TOOLSET)).toBe(`/toolSets/revision/`);
  });

  test('returns correct route for ROLE', () => {
    expect(getRevisionRouteForAllEntities(ActivityAuditResourceType.ROLE)).toBe(`/roles/revision/`);
  });

  test('returns correct route for ROUTE', () => {
    expect(getRevisionRouteForAllEntities(ActivityAuditResourceType.ROUTE)).toBe(`/routes/revision/`);
  });

  test('returns correct route for APPLICATION_TYPE_SCHEMA', () => {
    expect(getRevisionRouteForAllEntities(ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA)).toBe(
      `/applicationTypeSchemas/revision/`,
    );
  });

  test('returns correct route for INTERCEPTOR_TEMPLATE', () => {
    expect(getRevisionRouteForAllEntities(ActivityAuditResourceType.INTERCEPTOR_TEMPLATE)).toBe(
      `/interceptor-runners/revision/`,
    );
  });

  test('returns correct route for SYSTEM_PROPERTIES', () => {
    expect(getRevisionRouteForAllEntities(ActivityAuditResourceType.SYSTEM_PROPERTIES)).toBe(
      `/global-settings/revision/`,
    );
  });

  test('returns null for unknown type', () => {
    expect(getRevisionRouteForAllEntities('UNKNOWN' as any)).toBeNull();
  });

  test('returns null when type is undefined', () => {
    expect(getRevisionRouteForAllEntities(undefined)).toBeNull();
  });
});
