import { MenuI18nKey } from '@/src/constants/i18n';
import { EntityType } from '@/src/types/entity-type';
import { ExportFormat, ExportType } from '@/src/types/export';
import { getActualTabs, getDataWithoutItem } from '../utils';

import { describe, expect, test } from 'vitest';

describe('Config content Utils :: getDataWithoutItem', () => {
  test('Should remove data from ApplicationRunners', () => {
    const result = getDataWithoutItem(
      [{ $id: 'runner1' }, { $id: 'runner2' }, { $id: 'runner3' }, { $id: 'runner4' }, { $id: 'runner5' }],
      { $id: 'runner3' },
      EntityType.APPLICATION_TYPE_SCHEMA,
    );

    expect(result).toEqual([{ $id: 'runner1' }, { $id: 'runner2' }, { $id: 'runner4' }, { $id: 'runner5' }]);
  });

  test('Should remove data from Files', () => {
    const result = getDataWithoutItem(
      [{ path: 'path1' }, { path: 'path2' }, { path: 'path3' }, { path: 'path4' }, { path: 'path5' }],
      { path: 'path4' },
      EntityType.FILE,
    );

    expect(result).toEqual([{ path: 'path1' }, { path: 'path2' }, { path: 'path3' }, { path: 'path5' }]);
  });

  test('Should remove data from Prompts', () => {
    const result = getDataWithoutItem(
      [{ path: 'path1' }, { path: 'path2' }, { path: 'path3' }, { path: 'path4' }, { path: 'path5' }],
      { path: 'path5' },
      EntityType.PROMPT,
    );

    expect(result).toEqual([{ path: 'path1' }, { path: 'path2' }, { path: 'path3' }, { path: 'path4' }]);
  });

  test('Should remove data from Models', () => {
    const result = getDataWithoutItem(
      [{ name: 'name1' }, { name: 'name2' }, { name: 'name3' }, { name: 'name4' }, { name: 'name5' }],
      { name: 'name5' },
      EntityType.MODEL,
    );

    expect(result).toEqual([{ name: 'name1' }, { name: 'name2' }, { name: 'name3' }, { name: 'name4' }]);
  });
});

describe('Config content Utils :: getActualTabs', () => {
  const mockTranslate = (v: string) => v;

  test('Should return empty tabs', () => {
    const res1 = getActualTabs(ExportType.Full, ExportFormat.CORE, {}, mockTranslate);
    const res2 = getActualTabs(ExportType.Full, ExportFormat.ADMIN, {}, mockTranslate);

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  test('Should return tabs for full core config', () => {
    const res = getActualTabs(ExportType.Full, ExportFormat.CORE, { roles: true, files: true }, mockTranslate);

    expect(res).toEqual([{ id: EntityType.ROLE, label: MenuI18nKey.Roles }]);
  });

  test('Should return tabs for custom admin config', () => {
    const res = getActualTabs(ExportType.Custom, ExportFormat.ADMIN, { roles: true, files: true }, mockTranslate);

    expect(res).toEqual([
      { id: EntityType.MODEL, label: MenuI18nKey.Models },
      { id: EntityType.APPLICATION, label: MenuI18nKey.Applications },
      { id: EntityType.TOOLSET, label: MenuI18nKey.Toolsets },
      { id: EntityType.INTERCEPTOR, label: MenuI18nKey.Interceptors },
      { id: EntityType.ROUTE, label: MenuI18nKey.Routes },
      { id: EntityType.APPLICATION_TYPE_SCHEMA, label: MenuI18nKey.ApplicationRunners },
      { id: EntityType.ADAPTER, label: MenuI18nKey.Adapters },
      { id: EntityType.INTERCEPTOR_RUNNER, label: MenuI18nKey.InterceptorTemplates },
      { id: EntityType.ROLE, label: MenuI18nKey.Roles },
      { id: EntityType.KEY, label: MenuI18nKey.Keys },
    ]);
  });

  test('Should include ADAPTER tab for non-core formats', () => {
    const res = getActualTabs(ExportType.Full, ExportFormat.ADMIN, { adapters: true }, mockTranslate);

    expect(res).toEqual([{ id: EntityType.ADAPTER, label: MenuI18nKey.Adapters }]);
  });

  test('Should not include ADAPTER tab for CORE format', () => {
    const res = getActualTabs(ExportType.Full, ExportFormat.CORE, { adapters: true }, mockTranslate);

    expect(res).toEqual([]);
  });

  test('Should return all tabs if all flags set and format is ADMIN', () => {
    const res = getActualTabs(
      ExportType.Full,
      ExportFormat.ADMIN,
      {
        models: true,
        applications: true,
        toolSets: true,
        routes: true,
        interceptorsTemplates: true,
        roles: true,
        keys: true,
        runners: true,
        interceptors: true,
        adapters: true,
      },
      mockTranslate,
    );

    expect(res).toEqual([
      { id: EntityType.MODEL, label: MenuI18nKey.Models },
      { id: EntityType.APPLICATION, label: MenuI18nKey.Applications },
      { id: EntityType.TOOLSET, label: MenuI18nKey.Toolsets },
      { id: EntityType.INTERCEPTOR, label: MenuI18nKey.Interceptors },
      { id: EntityType.ROUTE, label: MenuI18nKey.Routes },
      { id: EntityType.APPLICATION_TYPE_SCHEMA, label: MenuI18nKey.ApplicationRunners },
      { id: EntityType.ADAPTER, label: MenuI18nKey.Adapters },
      { id: EntityType.INTERCEPTOR_RUNNER, label: MenuI18nKey.InterceptorTemplates },
      { id: EntityType.ROLE, label: MenuI18nKey.Roles },
      { id: EntityType.KEY, label: MenuI18nKey.Keys },
    ]);
  });
});
