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

  test('returns correct route for ASSISTANT', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.ASSISTANT, id)).toBe(`/assistants/${id}/revision/`);
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

  test('returns correct route for APPLICATION_TYPE_SCHEMA', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA, id)).toBe(
      `/applicationTypeSchemas/snapshot?id=${id}&revision=`,
    );
  });

  test('returns correct route for ADDON', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.ADDON, id)).toBe(`/addons/${id}/revision/`);
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

  test('returns correct route for ASSISTANT', () => {
    expect(getRevisionRouteForAllEntities(ActivityAuditResourceType.ASSISTANT)).toBe(`/assistants/revision/`);
  });

  test('returns correct route for INTERCEPTOR', () => {
    expect(getRevisionRouteForAllEntities(ActivityAuditResourceType.INTERCEPTOR)).toBe(`/interceptors/revision/`);
  });

  test('returns correct route for KEY', () => {
    expect(getRevisionRouteForAllEntities(ActivityAuditResourceType.KEY)).toBe(`/keys/revision/`);
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

  test('returns correct route for ADDON', () => {
    expect(getRevisionRouteForAllEntities(ActivityAuditResourceType.ADDON)).toBe(`/addons/revision/`);
  });

  test('returns null for unknown type', () => {
    expect(getRevisionRouteForAllEntities('UNKNOWN' as any)).toBeNull();
  });

  test('returns null when type is undefined', () => {
    expect(getRevisionRouteForAllEntities(undefined)).toBeNull();
  });
});
