import { EntitiesI18nKey, MenuI18nKey } from '@/src/constants/i18n';
import { ExportComponentType, ExportFormat, ExportType } from '@/src/types/export';
import {
  getComponents,
  getComponentTypes,
  getEmptyDataTitleI18nKey,
  isEntityWithDependency,
} from '../ExportConfig.utils';

describe('Export Config Utils :: getComponentTypes', () => {
  it('Should return empty array', () => {
    const res1 = getComponentTypes({}, ExportFormat.ADMIN, ExportType.Full);
    const res2 = getComponentTypes({}, ExportFormat.CORE, ExportType.Full);
    const res3 = getComponentTypes({}, ExportFormat.CORE, ExportType.Custom);

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
    expect(res3).toEqual([]);
  });

  it('Should return tabs for full core config', () => {
    const res = getComponentTypes(
      { entities: true, roles: true, keys: true, runners: true, interceptors: true, prompts: true, files: true },
      ExportFormat.ADMIN,
      ExportType.Full,
    );

    expect(res).toEqual([
      ExportComponentType.APPLICATION,
      ExportComponentType.MODEL,
      ExportComponentType.ROUTE,
      ExportComponentType.ROLE,
      ExportComponentType.KEY,
      ExportComponentType.APPLICATION_TYPE_SCHEMA,
      ExportComponentType.INTERCEPTOR,
      // ExportComponentType.PROMPT,
      // ExportComponentType.FILE,
    ]);
  });
});

describe('Export Config Utils :: getComponents', () => {
  it('Should return empty array', () => {
    const res1 = getComponents(ExportType.Full, {});
    const res2 = getComponents(ExportType.Custom, {});

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  it('Should return components for custom core config', () => {
    const res = getComponents(ExportType.Custom, {
      [ExportComponentType.ENTITIES]: [
        { name: 'Model', type: MenuI18nKey.Models, dependencies: [ExportComponentType.ROLE] },
        { name: 'Application', type: MenuI18nKey.Applications, dependencies: [ExportComponentType.ROLE] },
        { name: 'Route', type: MenuI18nKey.Routes, dependencies: [ExportComponentType.ROLE] },
      ],
      [ExportComponentType.ROLE]: [{ name: 'role', type: MenuI18nKey.Roles }],
    });

    expect(res).toEqual([
      { name: 'Model', type: ExportComponentType.MODEL, dependencies: [ExportComponentType.ROLE] },
      { name: 'Application', type: ExportComponentType.APPLICATION, dependencies: [ExportComponentType.ROLE] },
      { name: 'Route', type: ExportComponentType.ROUTE, dependencies: [ExportComponentType.ROLE] },
      { name: 'role', type: ExportComponentType.ROLE, dependencies: [] },
    ]);
  });

  it('Should return tabs for custom core config with correct dependencies', () => {
    const res = getComponents(ExportType.Custom, {
      [ExportComponentType.ENTITIES]: [
        { name: 'Model', type: MenuI18nKey.Models, dependencies: [ExportComponentType.ENTITIES] },
      ],
    });

    expect(res).toEqual([
      {
        name: 'Model',
        type: ExportComponentType.MODEL,
        dependencies: [ExportComponentType.APPLICATION, ExportComponentType.MODEL, ExportComponentType.ROUTE],
      },
    ]);
  });
});

describe('Export Config Utils :: getEmptyDataTitleI18nKey', () => {
  it('Should return key for roles', () => {
    const res = getEmptyDataTitleI18nKey(ExportComponentType.ROLE);

    expect(res).toEqual(EntitiesI18nKey.NoRoles);
  });

  it('Should return key for keys', () => {
    const res = getEmptyDataTitleI18nKey(ExportComponentType.KEY);

    expect(res).toEqual(EntitiesI18nKey.NoKeys);
  });

  it('Should return key for runners', () => {
    const res = getEmptyDataTitleI18nKey(ExportComponentType.APPLICATION_TYPE_SCHEMA);

    expect(res).toEqual(EntitiesI18nKey.NoApplicationRunners);
  });

  it('Should return key for interceptors', () => {
    const res = getEmptyDataTitleI18nKey(ExportComponentType.INTERCEPTOR);

    expect(res).toEqual(EntitiesI18nKey.NoInterceptors);
  });

  it('Should return key for prompts', () => {
    const res = getEmptyDataTitleI18nKey(ExportComponentType.PROMPT);

    expect(res).toEqual(EntitiesI18nKey.NoPrompts);
  });

  it('Should return key for files', () => {
    const res = getEmptyDataTitleI18nKey(ExportComponentType.FILE);

    expect(res).toEqual(EntitiesI18nKey.NoFiles);
  });

  it('Should return key for model', () => {
    const res = getEmptyDataTitleI18nKey(ExportComponentType.MODEL);

    expect(res).toEqual(EntitiesI18nKey.NoModels);
  });

  it('Should return key for applications', () => {
    const res = getEmptyDataTitleI18nKey(ExportComponentType.APPLICATION);

    expect(res).toEqual(EntitiesI18nKey.NoApplications);
  });

  it('Should return key for routes', () => {
    const res = getEmptyDataTitleI18nKey(ExportComponentType.ROUTE);

    expect(res).toEqual(EntitiesI18nKey.NoRoutes);
  });
});

describe('Export Config Utils :: isEntityWithDependency', () => {
  it('Should return true for roles', () => {
    const res = isEntityWithDependency(ExportComponentType.ROLE);

    expect(res).toEqual(true);
  });
  it('Should return false for app runner', () => {
    const res = isEntityWithDependency(ExportComponentType.APPLICATION_TYPE_SCHEMA);

    expect(res).toEqual(false);
  });
});
