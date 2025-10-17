import { describe, it, expect } from 'vitest';
import { getExportType } from './core-entity-utils';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityType } from '@/src/types/entity-type';

describe('getExportType', () => {
  it('returns MODEL for Models route', () => {
    expect(getExportType(ApplicationRoute.Models)).toBe(EntityType.MODEL);
  });
  it('returns APPLICATION for Applications route', () => {
    expect(getExportType(ApplicationRoute.Applications)).toBe(EntityType.APPLICATION);
  });
  it('returns TOOLSET for Toolsets route', () => {
    expect(getExportType(ApplicationRoute.Toolsets)).toBe(EntityType.TOOLSET);
  });
  it('returns ROUTE for Routes route', () => {
    expect(getExportType(ApplicationRoute.Routes)).toBe(EntityType.ROUTE);
  });
  it('returns ROLE for Roles route', () => {
    expect(getExportType(ApplicationRoute.Roles)).toBe(EntityType.ROLE);
  });
  it('returns KEY for Keys route', () => {
    expect(getExportType(ApplicationRoute.Keys)).toBe(EntityType.KEY);
  });
  it('returns APPLICATION_TYPE_SCHEMA for ApplicationRunners route', () => {
    expect(getExportType(ApplicationRoute.ApplicationRunners)).toBe(EntityType.APPLICATION_TYPE_SCHEMA);
  });
  it('returns INTERCEPTOR for Interceptors route', () => {
    expect(getExportType(ApplicationRoute.Interceptors)).toBe(EntityType.INTERCEPTOR);
  });
  it('returns empty string for unknown route', () => {
    expect(getExportType('unknown' as ApplicationRoute)).toBe('');
  });
});
