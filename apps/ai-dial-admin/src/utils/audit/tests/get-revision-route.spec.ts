import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import { getRevisionRouteForEntityType } from '../get-revision-route';

describe('Audit :: getRevisionRouteForEntityType', () => {
  const id = '12345';

  it('returns correct route for MODEL', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.MODEL, id)).toBe(`/models/${id}/revision/`);
  });

  it('returns correct route for APPLICATION', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.APPLICATION, id)).toBe(
      `/applications/${id}/revision/`,
    );
  });

  it('returns correct route for ADAPTER', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.ADAPTER, id)).toBe(`/adapters/${id}/revision/`);
  });

  it('returns correct route for ASSISTANT', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.ASSISTANT, id)).toBe(`/assistants/${id}/revision/`);
  });

  it('returns correct route for INTERCEPTOR', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.INTERCEPTOR, id)).toBe(
      `/interceptors/${id}/revision/`,
    );
  });

  it('returns correct route for KEY', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.KEY, id)).toBe(`/keys/${id}/revision/`);
  });

  it('returns correct route for ROLE', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.ROLE, id)).toBe(`/roles/${id}/revision/`);
  });

  it('returns correct route for ROUTE', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.ROUTE, id)).toBe(`/routes/${id}/revision/`);
  });

  it('returns correct route for APPLICATION_TYPE_SCHEMA', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA, id)).toBe(
      `/applicationTypeSchemas/snapshot?id=${id}&revision=`,
    );
  });

  it('returns correct route for ADDON', () => {
    expect(getRevisionRouteForEntityType(ActivityAuditResourceType.ADDON, id)).toBe(`/addons/${id}/revision/`);
  });

  it('returns null for unknown type', () => {
    expect(getRevisionRouteForEntityType('UNKNOWN' as any, id)).toBeNull();
  });

  it('returns null when type is undefined', () => {
    expect(getRevisionRouteForEntityType(undefined, id)).toBeNull();
  });
});
