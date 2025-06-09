import { MenuI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import {
  getInterceptorsForEntitiesGrid,
  getAddonsForEntitiesGrid,
  getRoutesForEntitiesGrid,
  getRunnersForEntitiesGrid,
} from '../entities-list-view';

describe('Utils :: getInterceptorsForEntitiesGrid', () => {
  it('Should return empty array', () => {
    const res1 = getInterceptorsForEntitiesGrid(null);
    const res2 = getInterceptorsForEntitiesGrid();

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  it('Should return array with type and route', () => {
    const res1 = getInterceptorsForEntitiesGrid([{ name: 'interceptor' }]);

    expect(res1).toEqual([
      { name: 'interceptor', type: MenuI18nKey.Interceptors, route: ApplicationRoute.Interceptors },
    ]);
  });
});

describe('Utils :: getRunnersForEntitiesGrid', () => {
  it('Should return empty array', () => {
    const res1 = getRunnersForEntitiesGrid(null);
    const res2 = getRunnersForEntitiesGrid();

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  it('Should return array with type and route', () => {
    const res1 = getRunnersForEntitiesGrid([{ $id: 'runner' }]);

    expect(res1).toEqual([
      { $id: 'runner', type: MenuI18nKey.ApplicationRunners, route: ApplicationRoute.ApplicationRunners },
    ]);
  });
});

describe('Utils :: getAddonsForEntitiesGrid', () => {
  it('Should return empty array', () => {
    const res1 = getAddonsForEntitiesGrid(null);
    const res2 = getAddonsForEntitiesGrid();

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  it('Should return array with type and route', () => {
    const res1 = getAddonsForEntitiesGrid([{ name: 'addon' }]);

    expect(res1).toEqual([{ name: 'addon', type: MenuI18nKey.Addons, route: ApplicationRoute.Addons }]);
  });
});

describe('Utils :: getRoutesForEntitiesGrid', () => {
  it('Should return empty array', () => {
    const res1 = getRoutesForEntitiesGrid(null);
    const res2 = getRoutesForEntitiesGrid();

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  it('Should return array with type and route', () => {
    const res1 = getRoutesForEntitiesGrid([{ name: 'route' }]);

    expect(res1).toEqual([{ name: 'route', type: MenuI18nKey.Routes, route: ApplicationRoute.Routes }]);
  });
});
