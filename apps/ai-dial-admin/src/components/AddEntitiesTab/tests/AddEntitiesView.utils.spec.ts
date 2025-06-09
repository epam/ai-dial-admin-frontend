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

const data = [
  { name: 'model', type: MenuI18nKey.Models, route: ApplicationRoute.Models },
  { name: 'application', type: MenuI18nKey.Applications, route: ApplicationRoute.Applications },
  { name: 'addon', type: MenuI18nKey.Addons, route: ApplicationRoute.Addons },
  { name: 'role', type: MenuI18nKey.Roles, route: ApplicationRoute.Roles },
  { name: 'key', type: MenuI18nKey.Keys, route: ApplicationRoute.Keys },
];

const keys = [{ name: 'key', type: MenuI18nKey.Keys, route: ApplicationRoute.Keys }];

describe('Add Entities tab :: getEntitiesGridData', () => {
  it('Should return all items', () => {
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
  it('Should return empty array', () => {
    expect(getEntitiesForRole({}, data)).toEqual([]);
  });

  it('Should return array with model', () => {
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

  it('Should return array with model', () => {
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
  it('Should return empty array', () => {
    expect(getRelevantDataForInterceptor({}, data)).toEqual([]);
  });

  it('Should return array with model', () => {
    expect(getRelevantDataForInterceptor({ entities: ['model', 'model1'] }, data)).toEqual([data[0]]);
  });
});

describe('Add Entities tab :: getRelevantDataForAppRunner ', () => {
  it('Should return empty array', () => {
    expect(getRelevantDataForAppRunner({}, data)).toEqual([]);
  });

  it('Should return array with applications', () => {
    expect(getRelevantDataForAppRunner({ applications: ['application', 'application1'] }, data)).toEqual([data[1]]);
  });
});

describe('Add Entities tab :: getAvailableEntities ', () => {
  it('Should return filtered data', () => {
    const existing = [{ ...data[0] }];
    const result = getAvailableEntities(existing, data);
    expect(result).toEqual([
      { name: 'application', type: MenuI18nKey.Applications, route: ApplicationRoute.Applications },
      { name: 'addon', type: MenuI18nKey.Addons, route: ApplicationRoute.Addons },
      { name: 'role', type: MenuI18nKey.Roles, route: ApplicationRoute.Roles },
      { name: 'key', type: MenuI18nKey.Keys, route: ApplicationRoute.Keys },
    ]);
  });

  it('Should return filtered data', () => {
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

  it('Should return same data', () => {
    const existing = [];
    const result = getAvailableEntities(existing, data);
    expect(result).toEqual(data);
  });
});

describe('Add Entities tab :: getRelevantRolesForKey ', () => {
  it('Should return empty array', () => {
    expect(getRelevantRolesForKey({}, data)).toEqual([]);
  });

  it('Should return array with model', () => {
    expect(getRelevantRolesForKey({ roles: ['model'] }, data)).toEqual([data[0]]);
  });
});

describe('Add Entities tab :: getRelevantKeysForRole ', () => {
  it('Should return empty array', () => {
    expect(getRelevantKeysForRole({}, keys)).toEqual([]);
  });

  it('Should return array with key', () => {
    expect(getRelevantKeysForRole({ grantedKeys: ['key', 'keyy'] }, keys)).toEqual([
      { name: 'key', type: MenuI18nKey.Keys, route: ApplicationRoute.Keys },
    ]);
  });
});
