import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { ExportFormat, ExportType } from '@/src/types/export';
import {
  getComponents,
  getComponentTypes,
  isEntityWithDependency,
} from '../ExportConfig.utils';
import { EntityType } from '@/src/types/entity-type';
import { getEmptyDataTitleI18nKey } from '@/src/utils/entities/get-empty-data-title';
import { describe, expect, test } from 'vitest';
describe('Export Config Utils :: getComponentTypes', () => {
  test('Should return empty array', () => {
    const res1 = getComponentTypes({}, ExportFormat.ADMIN, ExportType.Full);
    const res2 = getComponentTypes({}, ExportFormat.CORE, ExportType.Full);
    const res3 = getComponentTypes({}, ExportFormat.CORE, ExportType.Custom);

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
    expect(res3).toEqual([]);
  });

  test('Should return tabs for full core config', () => {
    const res = getComponentTypes(
      { entities: true, roles: true, keys: true, runners: true, interceptors: true, prompts: true, files: true },
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
      // EntityType.PROMPT,
      // EntityType.FILE,
    ]);
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
      [EntityType.ENTITIES]: [
        { name: 'Model', type: MenuI18nKey.Models, dependencies: [EntityType.ENTITIES] },
      ],
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

describe('Export Config Utils :: getEmptyDataTitleI18nKey', () => {
  test('Should return key for roles', () => {
    const res = getEmptyDataTitleI18nKey(EntityType.ROLE);

    expect(res).toEqual(EntitiesI18nKey.NoRoles);
  });

  test('Should return key for keys', () => {
    const res = getEmptyDataTitleI18nKey(EntityType.KEY);

    expect(res).toEqual(EntitiesI18nKey.NoKeys);
  });

  test('Should return key for runners', () => {
    const res = getEmptyDataTitleI18nKey(EntityType.APPLICATION_TYPE_SCHEMA);

    expect(res).toEqual(EntitiesI18nKey.NoApplicationRunners);
  });

  test('Should return key for interceptors', () => {
    const res = getEmptyDataTitleI18nKey(EntityType.INTERCEPTOR);

    expect(res).toEqual(EntitiesI18nKey.NoInterceptors);
  });

  test('Should return key for prompts', () => {
    const res = getEmptyDataTitleI18nKey(EntityType.PROMPT);

    expect(res).toEqual(EntitiesI18nKey.NoPrompts);
  });

  test('Should return key for files', () => {
    const res = getEmptyDataTitleI18nKey(EntityType.FILE);

    expect(res).toEqual(EntitiesI18nKey.NoFiles);
  });

  test('Should return key for model', () => {
    const res = getEmptyDataTitleI18nKey(EntityType.MODEL);

    expect(res).toEqual(EntitiesI18nKey.NoModels);
  });

  test('Should return key for applications', () => {
    const res = getEmptyDataTitleI18nKey(EntityType.APPLICATION);

    expect(res).toEqual(EntitiesI18nKey.NoApplications);
  });

  test('Should return key for routes', () => {
    const res = getEmptyDataTitleI18nKey(EntityType.ROUTE);

    expect(res).toEqual(EntitiesI18nKey.NoRoutes);
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
