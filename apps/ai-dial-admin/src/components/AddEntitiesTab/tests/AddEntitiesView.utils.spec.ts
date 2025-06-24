import { ApplicationRoute } from '@/src/types/routes';
import {
  getAvailableEntities,
  getEntitiesGridData,
  getRelevantDataForInterceptor,
  getRelevantKeysForRole,
  getRelevantRolesForKey,
  getEntitiesForRole,
  getRelevantDataForAppRunner,
} from '../AddEntitiesView.utils';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { MenuI18nKey } from '@/src/constants/i18n';
import { describe, expect, test } from 'vitest';

const data = [
  { name: 'model', type: MenuI18nKey.Models, route: ApplicationRoute.Models },
  { name: 'application', type: MenuI18nKey.Applications, route: ApplicationRoute.Applications },
  { name: 'addon', type: MenuI18nKey.Addons, route: ApplicationRoute.Addons },
  { name: 'role', type: MenuI18nKey.Roles, route: ApplicationRoute.Roles },
  { name: 'key', type: MenuI18nKey.Keys, route: ApplicationRoute.Keys },
];

const keys = [{ name: 'key', type: MenuI18nKey.Keys, route: ApplicationRoute.Keys }];

describe('Add Entities tab :: getEntitiesGridData', () => {
  test('Should return all items', () => {
    expect(
      getEntitiesGridData(
        [{ name: 'model' }],
        [{ name: 'application' }],
        [{ name: 'addon' }],
        [{ name: 'role' }],
        [{ name: 'key' }],
      ),
    ).toEqual(data);
  });
});

describe('Add Entities tab :: getEntitiesForRole ', () => {
  test('Should return empty array', () => {
    expect(getEntitiesForRole({}, data)).toEqual([]);
  });

  test('Should return array with model', () => {
    expect(getEntitiesForRole({ limits: { model: { day: 1 } }, model1: { day: 1 } }, data)).toEqual([
      {
        day: 1,
        minute: 'No Limits',
        week: 'No Limits',
        month: 'No Limits',
        name: 'model',
        route: ApplicationRoute.Models,
        type: MenuI18nKey.Models,
      },
    ]);
  });

  test('Should return array with model', () => {
    expect(
      getEntitiesForRole(
        { limits: { model: { minute: 1, week: 2, month: 3 } }, model1: { minute: 1, week: 2, month: 3 } },
        data,
      ),
    ).toEqual([
      {
        day: 'No Limits',
        minute: 1,
        week: 2,
        month: 3,
        name: 'model',
        route: ApplicationRoute.Models,
        type: MenuI18nKey.Models,
      },
    ]);
  });
});

describe('Add Entities tab :: getRelevantDataForInterceptor ', () => {
  test('Should return empty array', () => {
    expect(getRelevantDataForInterceptor({}, data)).toEqual([]);
  });

  test('Should return array with model', () => {
    expect(getRelevantDataForInterceptor({ entities: ['model', 'model1'] }, data)).toEqual([data[0]]);
  });
});

describe('Add Entities tab :: getRelevantDataForAppRunner ', () => {
  test('Should return empty array', () => {
    expect(getRelevantDataForAppRunner({}, data)).toEqual([]);
  });

  test('Should return array with applications', () => {
    expect(getRelevantDataForAppRunner({ applications: ['application', 'application1'] }, data)).toEqual([data[1]]);
  });
});

describe('Add Entities tab :: getAvailableEntities ', () => {
  test('Should return filtered data', () => {
    const existing = [{ ...data[0] }];
    const result = getAvailableEntities(existing, data);
    expect(result).toEqual([
      { name: 'application', type: MenuI18nKey.Applications, route: ApplicationRoute.Applications },
      { name: 'addon', type: MenuI18nKey.Addons, route: ApplicationRoute.Addons },
      { name: 'role', type: MenuI18nKey.Roles, route: ApplicationRoute.Roles },
      { name: 'key', type: MenuI18nKey.Keys, route: ApplicationRoute.Keys },
    ]);
  });

  test('Should return filtered data', () => {
    const existing = [{ key: 'key', type: MenuI18nKey.Key, route: ApplicationRoute.Keys }];
    const result = getAvailableEntities(existing, [
      { name: 'model', type: MenuI18nKey.Models, route: ApplicationRoute.Models },
      { name: 'application', type: MenuI18nKey.Applications, route: ApplicationRoute.Applications },
      { name: 'addon', type: MenuI18nKey.Addons, route: ApplicationRoute.Addons },
      { name: 'role', type: MenuI18nKey.Roles, route: ApplicationRoute.Roles },
      { key: 'key', type: MenuI18nKey.Keys, route: ApplicationRoute.Keys },
    ] as EntitiesGridData[]);
    expect(result).toEqual([
      { name: 'model', type: MenuI18nKey.Models, route: ApplicationRoute.Models },
      { name: 'application', type: MenuI18nKey.Applications, route: ApplicationRoute.Applications },
      { name: 'addon', type: MenuI18nKey.Addons, route: ApplicationRoute.Addons },
      { name: 'role', type: MenuI18nKey.Roles, route: ApplicationRoute.Roles },
    ]);
  });

  test('Should return same data', () => {
    const existing = [];
    const result = getAvailableEntities(existing, data);
    expect(result).toEqual(data);
  });
});

describe('Add Entities tab :: getRelevantRolesForKey ', () => {
  test('Should return empty array', () => {
    expect(getRelevantRolesForKey({}, data)).toEqual([]);
  });

  test('Should return array with model', () => {
    expect(getRelevantRolesForKey({ roles: ['model'] }, data)).toEqual([data[0]]);
  });
});

describe('Add Entities tab :: getRelevantKeysForRole ', () => {
  test('Should return empty array', () => {
    expect(getRelevantKeysForRole({}, keys)).toEqual([]);
  });

  test('Should return array with key', () => {
    expect(getRelevantKeysForRole({ grantedKeys: ['key', 'keyy'] }, keys)).toEqual([
      { name: 'key', type: MenuI18nKey.Keys, route: ApplicationRoute.Keys },
    ]);
  });
});
