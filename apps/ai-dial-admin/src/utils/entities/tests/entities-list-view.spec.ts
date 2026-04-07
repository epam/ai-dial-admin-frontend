import { MenuI18nKey } from '@/src/constants/i18n';
import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import {
  getAdaptersForEntitiesGrid,
  getApplicationsForEntitiesGrid,
  getInterceptorsForEntitiesGrid,
  getInterceptorTemplatesForEntitiesGrid,
  getTemplatesForEntitiesGrid,
  getKeysForEntitiesGrid,
  getModelsForEntitiesGrid,
  getRolesForEntitiesGrid,
  getRoutesForEntitiesGrid,
  getRunnersForEntitiesGrid,
  getToolsetsForEntitiesGrid,
} from '../entities-list-view';

describe('Utils :: getModelsForEntitiesGrid', () => {
  test('Should return empty array', () => {
    const res1 = getModelsForEntitiesGrid(null);
    const res2 = getModelsForEntitiesGrid();

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  test('Should return array with type and route', () => {
    const res1 = getModelsForEntitiesGrid([{ name: 'model' }]);

    expect(res1).toEqual([{ name: 'model', type: MenuI18nKey.Models, route: ApplicationRoute.Models }]);
  });
});

describe('Utils :: getApplicationsForEntitiesGrid', () => {
  test('Should return empty array', () => {
    const res1 = getApplicationsForEntitiesGrid(null);
    const res2 = getApplicationsForEntitiesGrid();

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  test('Should return array with type and route', () => {
    const res1 = getApplicationsForEntitiesGrid([{ name: 'application' }]);

    expect(res1).toEqual([
      { name: 'application', type: MenuI18nKey.Applications, route: ApplicationRoute.Applications },
    ]);
  });
});

describe('Utils :: getTemplatesForEntitiesGrid', () => {
  test('Should return empty array', () => {
    const res1 = getTemplatesForEntitiesGrid(null);
    const res2 = getTemplatesForEntitiesGrid();

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  test('Should return array with type and route', () => {
    const res1 = getTemplatesForEntitiesGrid([{ name: 'template' }]);

    expect(res1).toEqual([
      { name: 'template', type: MenuI18nKey.InterceptorTemplates, route: ApplicationRoute.InterceptorTemplates },
    ]);
  });
});

describe('Utils :: getInterceptorsForEntitiesGrid', () => {
  test('Should return empty array', () => {
    const res1 = getInterceptorsForEntitiesGrid(null);
    const res2 = getInterceptorsForEntitiesGrid();

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  test('Should return array with type and route', () => {
    const res1 = getInterceptorsForEntitiesGrid([{ name: 'interceptor' }]);

    expect(res1).toEqual([
      { name: 'interceptor', type: MenuI18nKey.Interceptors, route: ApplicationRoute.Interceptors },
    ]);
  });
});

describe('Utils :: getRunnersForEntitiesGrid', () => {
  test('Should return empty array', () => {
    const res1 = getRunnersForEntitiesGrid(null);
    const res2 = getRunnersForEntitiesGrid();

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  test('Should return array with type and route', () => {
    const res1 = getRunnersForEntitiesGrid([{ $id: 'runner' }]);

    expect(res1).toEqual([
      { $id: 'runner', type: MenuI18nKey.ApplicationRunners, route: ApplicationRoute.ApplicationRunners },
    ]);
  });
});

describe('Utils :: getToolsetsForEntitiesGrid', () => {
  test('Should return empty array', () => {
    const res1 = getToolsetsForEntitiesGrid(null);
    const res2 = getToolsetsForEntitiesGrid();

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  test('Should return array with type and route', () => {
    const res1 = getToolsetsForEntitiesGrid([{ name: 'route' }]);

    expect(res1).toEqual([{ name: 'route', type: MenuI18nKey.Toolsets, route: ApplicationRoute.Toolsets }]);
  });
});

describe('Utils :: getRoutesForEntitiesGrid', () => {
  test('Should return empty array', () => {
    const res1 = getRoutesForEntitiesGrid(null);
    const res2 = getRoutesForEntitiesGrid();

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  test('Should return array with type and route', () => {
    const res1 = getRoutesForEntitiesGrid([{ name: 'route' }]);

    expect(res1).toEqual([{ name: 'route', type: MenuI18nKey.Routes, route: ApplicationRoute.Routes }]);
  });
});

describe('Utils :: getRolesForEntitiesGrid', () => {
  test('Should return empty array', () => {
    const res1 = getRolesForEntitiesGrid(null);
    const res2 = getRolesForEntitiesGrid();

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  test('Should return array with type and route', () => {
    const res1 = getRolesForEntitiesGrid([{ name: 'role' }]);

    expect(res1).toEqual([{ name: 'role', type: MenuI18nKey.Roles, route: ApplicationRoute.Roles }]);
  });
});

describe('Utils :: getKeysForEntitiesGrid', () => {
  test('Should return empty array', () => {
    const res1 = getKeysForEntitiesGrid(null);
    const res2 = getKeysForEntitiesGrid();

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  test('Should return array with type and route', () => {
    const res1 = getKeysForEntitiesGrid([{ name: 'key' }]);

    expect(res1).toEqual([{ name: 'key', type: MenuI18nKey.Keys, route: ApplicationRoute.Keys }]);
  });
});

describe('Utils :: getAdaptersForEntitiesGrid', () => {
  test('Should return empty array', () => {
    const res1 = getAdaptersForEntitiesGrid(null);
    const res2 = getAdaptersForEntitiesGrid();

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  test('Should return array with type and route', () => {
    const res1 = getAdaptersForEntitiesGrid([{ name: 'adapter' }]);

    expect(res1).toEqual([{ name: 'adapter', type: MenuI18nKey.Adapters, route: ApplicationRoute.Adapters }]);
  });
});

describe('Utils :: getInterceptorTemplatesForEntitiesGrid', () => {
  test('Should return empty array', () => {
    const res1 = getInterceptorTemplatesForEntitiesGrid(null);
    const res2 = getInterceptorTemplatesForEntitiesGrid();

    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
  });

  test('Should return array with type and route', () => {
    const res1 = getInterceptorTemplatesForEntitiesGrid([{ name: 'interceptorTemplate' }]);

    expect(res1).toEqual([
      {
        name: 'interceptorTemplate',
        type: MenuI18nKey.InterceptorTemplates,
        route: ApplicationRoute.InterceptorTemplates,
      },
    ]);
  });
});
