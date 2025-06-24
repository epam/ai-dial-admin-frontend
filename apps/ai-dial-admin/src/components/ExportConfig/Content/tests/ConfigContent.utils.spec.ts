import { ExportFormat, ExportType } from '@/src/types/export';
import { getActualTabs, getDataWithoutItem } from '../ConfigContent.utils';
import { EntityType } from '@/src/types/entity-type';
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
  const mockTranslate = (v) => v;
  test('Should return empty tabs', () => {
    const res1 = getActualTabs(ExportType.FULL, ExportFormat.CORE, {}, mockTranslate);
    const res2 = getActualTabs(ExportType.FULL, ExportFormat.ADMIN, {}, mockTranslate);

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  test('Should return tabs for full core config', () => {
    const res = getActualTabs(ExportType.FULL, ExportFormat.CORE, { roles: true, files: true }, mockTranslate);

    expect(res).toEqual([{ id: EntityType.ROLE, name: 'Menu.Roles' }]);
  });

  test('Should return tabs for custom admin config', () => {
    const res = getActualTabs(ExportType.Custom, ExportFormat.ADMIN, { roles: true, files: true }, mockTranslate);

    expect(res).toEqual([
      { id: EntityType.ENTITIES, name: 'Menu.Entities' },
      { id: EntityType.ROLE, name: 'Menu.Roles' },
      { id: EntityType.KEY, name: 'Menu.Keys' },
      { id: EntityType.APPLICATION_TYPE_SCHEMA, name: 'Menu.ApplicationRunners' },
      { id: EntityType.INTERCEPTOR, name: 'Menu.Interceptors' },
      // { id: EntityType.PROMPT, name: 'Menu.Prompts' },
      // { id: EntityType.FILE, name: 'Menu.Files' },
    ]);
  });
});
