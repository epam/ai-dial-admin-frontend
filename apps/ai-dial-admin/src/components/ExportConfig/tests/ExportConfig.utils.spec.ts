import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { ExportFormat, ExportType } from '@/src/types/export';
import { getComponents, getComponentTypes, isEntityWithDependency } from '../ExportConfig.utils';
import { EntityType } from '@/src/types/entity-type';
import { describe, expect, test } from 'vitest';

describe('Export Config Utils :: getComponentTypes', () => {
  test('Should return empty array for empty config or ExportType.Custom', () => {
    expect(getComponentTypes({}, ExportFormat.ADMIN, ExportType.Full)).toEqual([]);
    expect(getComponentTypes({}, ExportFormat.CORE, ExportType.Full)).toEqual([]);
    expect(getComponentTypes({}, ExportFormat.CORE, ExportType.Custom)).toEqual([]);
  });

  test('Should return entities, role, key, runner, interceptor for core format', () => {
    const res = getComponentTypes(
      {
        entities: true,
        roles: true,
        keys: true,
        runners: true,
        interceptors: true,
        adapters: true,
        prompts: true,
        files: true,
      },
      ExportFormat.CORE,
      ExportType.Full,
    );

    expect(res).toEqual([
      EntityType.APPLICATION,
      EntityType.MODEL,
      EntityType.ROUTE,
      EntityType.ROLE,
      EntityType.KEY,
      EntityType.APPLICATION_TYPE_SCHEMA,
      EntityType.INTERCEPTOR,
      // EntityType.PROMPT,
      // EntityType.FILE,
    ]);
  });

  test('Should return all valid types including adapter for non-core format', () => {
    const res = getComponentTypes(
      {
        entities: true,
        roles: true,
        keys: true,
        runners: true,
        interceptors: true,
        adapters: true,
        prompts: true,
        files: true,
      },
      ExportFormat.ADMIN,
      ExportType.Full,
    );

    expect(res).toEqual([
      EntityType.APPLICATION,
      EntityType.MODEL,
      EntityType.ROUTE,
      EntityType.ROLE,
      EntityType.KEY,
      EntityType.APPLICATION_TYPE_SCHEMA,
      EntityType.INTERCEPTOR,
      EntityType.ADAPTER,
      // EntityType.PROMPT,
      // EntityType.FILE,
    ]);
  });

  test('Should return only adapter if only adapter=true and non-core format', () => {
    const res = getComponentTypes({ adapters: true }, ExportFormat.ADMIN, ExportType.Full);

    expect(res).toEqual([EntityType.ADAPTER]);
  });

  test('Should exclude adapter if adapter=true but format is CORE', () => {
    const res = getComponentTypes({ adapters: true }, ExportFormat.CORE, ExportType.Full);

    expect(res).toEqual([]);
  });

  test('Should return empty if ExportType is Custom regardless of config', () => {
    const res = getComponentTypes(
      {
        entities: true,
        roles: true,
        adapters: true,
        keys: true,
        runners: true,
      },
      ExportFormat.ADMIN,
      ExportType.Custom,
    );

    expect(res).toEqual([]);
  });
});

describe('Export Config Utils :: getComponents', () => {
  test('Should return empty array', () => {
    const res1 = getComponents(ExportType.Full, {});
    const res2 = getComponents(ExportType.Custom, {});

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  test('Should return components for custom core config', () => {
    const res = getComponents(ExportType.Custom, {
      [EntityType.ENTITIES]: [
        { name: 'Model', type: MenuI18nKey.Models, dependencies: [EntityType.ROLE] },
        { name: 'Application', type: MenuI18nKey.Applications, dependencies: [EntityType.ROLE] },
        { name: 'Route', type: MenuI18nKey.Routes, dependencies: [EntityType.ROLE] },
      ],
      [EntityType.ROLE]: [{ name: 'role', type: MenuI18nKey.Roles }],
    });

    expect(res).toEqual([
      { name: 'Model', type: EntityType.MODEL, dependencies: [EntityType.ROLE] },
      { name: 'Application', type: EntityType.APPLICATION, dependencies: [EntityType.ROLE] },
      { name: 'Route', type: EntityType.ROUTE, dependencies: [EntityType.ROLE] },
      { name: 'role', type: EntityType.ROLE, dependencies: [] },
    ]);
  });

  test('Should return tabs for custom core config with correct dependencies', () => {
    const res = getComponents(ExportType.Custom, {
      [EntityType.ENTITIES]: [{ name: 'Model', type: MenuI18nKey.Models, dependencies: [EntityType.ENTITIES] }],
    });

    expect(res).toEqual([
      {
        name: 'Model',
        type: EntityType.MODEL,
        dependencies: [EntityType.APPLICATION, EntityType.MODEL, EntityType.ROUTE],
      },
    ]);
  });
});

describe('Export Config Utils :: isEntityWithDependency', () => {
  test('Should return true for roles', () => {
    const res = isEntityWithDependency(EntityType.ROLE);

    expect(res).toEqual(true);
  });
  test('Should return false for app runner', () => {
    const res = isEntityWithDependency(EntityType.APPLICATION_TYPE_SCHEMA);

    expect(res).toEqual(false);
  });
});
