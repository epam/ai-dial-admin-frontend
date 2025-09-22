import { describe, it, expect } from 'vitest';
import { getEntityFromFile, getExportType, getFileFromEntity } from './core-entity-utils';
import { ApplicationRoute } from '@/src/types/routes';
import { EntityType } from '@/src/types/entity-type';

const entity = { name: 'testEntity', value: 123 };
const file = {
  models: { testEntity: entity },
  applications: { testEntity: entity },
  toolsets: { testEntity: entity },
  routes: { testEntity: entity },
  roles: { testEntity: entity },
  keys: { testEntity: entity },
  applicationTypeSchemas: [entity],
  interceptors: { testEntity: entity },
} as any;

describe('getEntityFromFile', () => {
  it('returns entity from models', () => {
    expect(getEntityFromFile(ApplicationRoute.Models, 'testEntity', file)).toBe(entity);
  });
  it('returns entity from applications', () => {
    expect(getEntityFromFile(ApplicationRoute.Applications, 'testEntity', file)).toBe(entity);
  });
  it('returns entity from toolsets', () => {
    expect(getEntityFromFile(ApplicationRoute.Toolsets, 'testEntity', file)).toBe(entity);
  });
  it('returns entity from routes', () => {
    expect(getEntityFromFile(ApplicationRoute.Routes, 'testEntity', file)).toBe(entity);
  });
  it('returns entity from roles', () => {
    expect(getEntityFromFile(ApplicationRoute.Roles, 'testEntity', file)).toBe(entity);
  });
  it('returns entity from keys', () => {
    expect(getEntityFromFile(ApplicationRoute.Keys, 'testEntity', file)).toBe(entity);
  });
  it('returns entity from applicationTypeSchemas', () => {
    expect(getEntityFromFile(ApplicationRoute.ApplicationRunners, 'testEntity', file)).toBe(entity);
  });
  it('returns entity from interceptors', () => {
    expect(getEntityFromFile(ApplicationRoute.Interceptors, 'testEntity', file)).toBe(entity);
  });
  it('returns empty string for unknown route', () => {
    expect(getEntityFromFile('unknown' as ApplicationRoute, 'testEntity', file)).toBe('');
  });
});

describe('getFileFromEntity', () => {
  it('returns models record for Models route', () => {
    expect(getFileFromEntity(ApplicationRoute.Models, entity as any)).toEqual({ models: { testEntity: entity } });
  });
  it('returns applications record for Applications route', () => {
    expect(getFileFromEntity(ApplicationRoute.Applications, entity as any)).toEqual({
      applications: { testEntity: entity },
    });
  });
  it('returns toolsets record for Toolsets route', () => {
    expect(getFileFromEntity(ApplicationRoute.Toolsets, entity as any)).toEqual({ toolsets: { testEntity: entity } });
  });
  it('returns routes record for Routes route', () => {
    expect(getFileFromEntity(ApplicationRoute.Routes, entity as any)).toEqual({ routes: { testEntity: entity } });
  });
  it('returns roles record for Roles route', () => {
    expect(getFileFromEntity(ApplicationRoute.Roles, entity as any)).toEqual({ roles: { testEntity: entity } });
  });
  it('returns keys record for Keys route', () => {
    expect(getFileFromEntity(ApplicationRoute.Keys, entity as any)).toEqual({ keys: { testEntity: entity } });
  });
  it('returns applicationTypeSchemas record for ApplicationRunners route', () => {
    expect(getFileFromEntity(ApplicationRoute.ApplicationRunners, entity as any)).toEqual({
      applicationTypeSchemas: [entity],
    });
  });
  it('returns interceptors record for Interceptors route', () => {
    expect(getFileFromEntity(ApplicationRoute.Interceptors, entity as any)).toEqual({
      interceptors: { testEntity: entity },
    });
  });
  it('returns empty object for unknown route', () => {
    expect(getFileFromEntity('unknown' as ApplicationRoute, entity as any)).toEqual({});
  });
});

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
