import { ApplicationRoute } from '@/src/types/routes';
import { getCoreSyncStatusUrl } from '../get-core-sync-status-url';
import { describe, expect, test } from 'vitest';

describe('getCoreSyncStatusUrl', () => {
  const id = '12345';

  test('returns correct route for Models', () => {
    expect(getCoreSyncStatusUrl(ApplicationRoute.Models, id)).toBe(`/models/${id}/sync-state`);
  });

  test('returns correct route for Applications', () => {
    expect(getCoreSyncStatusUrl(ApplicationRoute.Applications, id)).toBe(`/applications/${id}/sync-state`);
  });

  test('returns correct route for Interceptors', () => {
    expect(getCoreSyncStatusUrl(ApplicationRoute.Interceptors, id)).toBe(`/interceptors/${id}/sync-state`);
  });

  test('returns correct route for Roles', () => {
    expect(getCoreSyncStatusUrl(ApplicationRoute.Roles, id)).toBe(`/roles/${id}/sync-state`);
  });

  test('returns correct route for Routes', () => {
    expect(getCoreSyncStatusUrl(ApplicationRoute.Routes, id)).toBe(`/routes/${id}/sync-state`);
  });

  test('returns correct route for Toolsets', () => {
    expect(getCoreSyncStatusUrl(ApplicationRoute.Toolsets, id)).toBe(`/toolSets/${id}/sync-state`);
  });

  test('returns correct route for ApplicationRunners', () => {
    expect(getCoreSyncStatusUrl(ApplicationRoute.ApplicationRunners, id)).toBe(
      `/applicationTypeSchemas/sync-state?id=${id}`,
    );
  });

  test('returns null for unknown type', () => {
    expect(getCoreSyncStatusUrl('UNKNOWN' as any, id)).toBeNull();
  });

  test('returns null when type is undefined', () => {
    expect(getCoreSyncStatusUrl(undefined, id)).toBeNull();
  });
});
