import { ExportComponentType, ExportFormat, ExportType } from '@/src/types/export';
import { ApplicationRoute } from '@/src/types/routes';
import { getActualTabs, getDataWithoutItem } from '../ConfigContent.utils';

describe('Config content Utils :: getDataWithoutItem', () => {
  it('Should remove data from ApplicationRunners', () => {
    const result = getDataWithoutItem(
      [{ $id: 'runner1' }, { $id: 'runner2' }, { $id: 'runner3' }, { $id: 'runner4' }, { $id: 'runner5' }],
      { $id: 'runner3' },
      ApplicationRoute.ApplicationRunners,
    );

    expect(result).toEqual([{ $id: 'runner1' }, { $id: 'runner2' }, { $id: 'runner4' }, { $id: 'runner5' }]);
  });

  it('Should remove data from Files', () => {
    const result = getDataWithoutItem(
      [{ path: 'path1' }, { path: 'path2' }, { path: 'path3' }, { path: 'path4' }, { path: 'path5' }],
      { path: 'path4' },
      ApplicationRoute.Files,
    );

    expect(result).toEqual([{ path: 'path1' }, { path: 'path2' }, { path: 'path3' }, { path: 'path5' }]);
  });

  it('Should remove data from Prompts', () => {
    const result = getDataWithoutItem(
      [{ path: 'path1' }, { path: 'path2' }, { path: 'path3' }, { path: 'path4' }, { path: 'path5' }],
      { path: 'path5' },
      ApplicationRoute.Prompts,
    );

    expect(result).toEqual([{ path: 'path1' }, { path: 'path2' }, { path: 'path3' }, { path: 'path4' }]);
  });

  it('Should remove data from Models', () => {
    const result = getDataWithoutItem(
      [{ name: 'name1' }, { name: 'name2' }, { name: 'name3' }, { name: 'name4' }, { name: 'name5' }],
      { name: 'name5' },
      ApplicationRoute.Models,
    );

    expect(result).toEqual([{ name: 'name1' }, { name: 'name2' }, { name: 'name3' }, { name: 'name4' }]);
  });
});

describe('Config content Utils :: getActualTabs', () => {
  const mockTranslate = (v) => v;
  it('Should return empty tabs', () => {
    const res1 = getActualTabs(ExportType.FULL, ExportFormat.CORE, {}, mockTranslate);
    const res2 = getActualTabs(ExportType.FULL, ExportFormat.ADMIN, {}, mockTranslate);

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  it('Should return tabs for full core config', () => {
    const res = getActualTabs(ExportType.FULL, ExportFormat.CORE, { roles: true, files: true }, mockTranslate);

    expect(res).toEqual([{ id: ExportComponentType.ROLE, name: 'Menu.Roles' }]);
  });

  it('Should return tabs for custom admin config', () => {
    const res = getActualTabs(ExportType.Custom, ExportFormat.ADMIN, { roles: true, files: true }, mockTranslate);

    expect(res).toEqual([
      { id: ExportComponentType.ENTITIES, name: 'Menu.Entities' },
      { id: ExportComponentType.ROLE, name: 'Menu.Roles' },
      { id: ExportComponentType.KEY, name: 'Menu.Keys' },
      { id: ExportComponentType.APPLICATION_TYPE_SCHEMA, name: 'Menu.ApplicationRunners' },
      { id: ExportComponentType.INTERCEPTOR, name: 'Menu.Interceptors' },
      // { id: ExportComponentType.PROMPT, name: 'Menu.Prompts' },
      // { id: ExportComponentType.FILE, name: 'Menu.Files' },
    ]);
  });
});
