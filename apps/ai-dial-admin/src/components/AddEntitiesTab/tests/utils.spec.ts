import { ApplicationRoute } from '@/src/types/routes';
import {
  getAvailableEntities,
  getEntitiesGridData,
  getRelevantDataForInterceptor,
  getRelevantKeysForRole,
  getRelevantRolesForKey,
  getEntitiesForRole,
  getRelevantDataForAppRunner,
  getRelevantModelsForAdapter,
} from '../utils';
import { EntitiesGridData } from '@/src/models/entities-grid-data';
import { MenuI18nKey } from '@/src/constants/i18n';
import { describe, expect, test } from 'vitest';

const data = [
  { name: 'model', type: MenuI18nKey.Models, route: ApplicationRoute.Models },
  { name: 'application', type: MenuI18nKey.Applications, route: ApplicationRoute.Applications },
  { name: 'role', type: MenuI18nKey.Roles, route: ApplicationRoute.Roles },
  { name: 'key', type: MenuI18nKey.Keys, route: ApplicationRoute.Keys },
];

const keys = [{ name: 'key', type: MenuI18nKey.Keys, route: ApplicationRoute.Keys }];

describe('Add Entities tab :: getEntitiesGridData', () => {
  test('Should return all items', () => {
    expect(
      getEntitiesGridData([{ name: 'model' }], [{ name: 'application' }], [{ name: 'role' }], [{ name: 'key' }]),
    ).toEqual(data);
  });
});

describe('Add Entities tab :: getEntitiesForRole ', () => {
  test('Should return empty array when no limits are defined', () => {
    expect(getEntitiesForRole({}, data)).toEqual([]);
  });

  test('Should return array with model and share properties when share is defined', () => {
    expect(
      getEntitiesForRole(
        {
          limits: { model: { day: 1 } },
          share: { model: { invitationTtl: 3600, maxAcceptedUsers: 10 } },
          model1: { day: 1 },
        },
        data,
      ),
    ).toEqual([
      {
        day: 1,
        minute: 'No Limits',
        week: 'No Limits',
        month: 'No Limits',
        name: 'model',
        route: ApplicationRoute.Models,
        type: MenuI18nKey.Models,
        invitationTtl: 3600,
        maxAcceptedUsers: 10,
      },
    ]);
  });

  test('Should return array with model and updated limits and share properties', () => {
    expect(
      getEntitiesForRole(
        {
          limits: { model: { minute: 1, week: 2, month: 3 } },
          share: { model: { invitationTtl: 1800, maxAcceptedUsers: 5 } },
          model1: { minute: 1, week: 2, month: 3 },
        },
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
        invitationTtl: 1800,
        maxAcceptedUsers: 5,
      },
    ]);
  });

  test('Should handle missing share properties and return "No Limits"', () => {
    expect(
      getEntitiesForRole(
        {
          limits: { model: { minute: 1, week: 2, month: 3 } },
          model1: { minute: 1, week: 2, month: 3 },
        },
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
        invitationTtl: 'No Limits',
        maxAcceptedUsers: 'No Limits',
      },
    ]);
  });

  test('Should handle multiple entities with some missing share properties', () => {
    expect(
      getEntitiesForRole(
        {
          limits: {
            model: { day: 1 },
            model2: { minute: 1, week: 2, month: 3 },
          },
          share: {
            model: { invitationTtl: 3600, maxAcceptedUsers: 10 },
          },
          model1: { day: 1 },
        },
        data,
      ),
    ).toEqual([
      {
        day: 1,
        minute: 'No Limits',
        week: 'No Limits',
        month: 'No Limits',
        name: 'model',
        route: ApplicationRoute.Models,
        type: MenuI18nKey.Models,
        invitationTtl: 3600,
        maxAcceptedUsers: 10,
      },
      {
        day: 'No Limits',
        minute: 1,
        week: 2,
        month: 3,
        invitationTtl: 'No Limits',
        maxAcceptedUsers: 'No Limits',
      },
    ]);
  });

  test('Should return empty array if role.limits is null or not an object', () => {
    expect(getEntitiesForRole({ limits: null }, data)).toEqual([]);
    expect(getEntitiesForRole({ limits: undefined }, data)).toEqual([]);
  });

  test('Should return empty array when no limits or share properties exist', () => {
    expect(getEntitiesForRole({}, data)).toEqual([]);
  });

  test('Should return data for entities that have limits and default "No Limits" for others', () => {
    expect(
      getEntitiesForRole(
        {
          limits: {
            model: { minute: 10 },
            model2: { month: 5 },
          },
          share: {
            model: { invitationTtl: 3600 },
          },
        },
        data,
      ),
    ).toEqual([
      {
        day: 'No Limits',
        minute: 10,
        week: 'No Limits',
        month: 'No Limits',
        name: 'model',
        route: ApplicationRoute.Models,
        type: MenuI18nKey.Models,
        invitationTtl: 3600,
        maxAcceptedUsers: 'No Limits',
      },
      {
        day: 'No Limits',
        minute: 'No Limits',
        week: 'No Limits',
        month: 5,
        invitationTtl: 'No Limits',
        maxAcceptedUsers: 'No Limits',
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
      { name: 'role', type: MenuI18nKey.Roles, route: ApplicationRoute.Roles },
      { name: 'key', type: MenuI18nKey.Keys, route: ApplicationRoute.Keys },
    ]);
  });

  test('Should return filtered data', () => {
    const existing = [{ key: 'key', type: MenuI18nKey.Key, route: ApplicationRoute.Keys }];
    const result = getAvailableEntities(existing, [
      { name: 'model', type: MenuI18nKey.Models, route: ApplicationRoute.Models },
      { name: 'application', type: MenuI18nKey.Applications, route: ApplicationRoute.Applications },
      { name: 'role', type: MenuI18nKey.Roles, route: ApplicationRoute.Roles },
      { key: 'key', type: MenuI18nKey.Keys, route: ApplicationRoute.Keys },
    ] as EntitiesGridData[]);
    expect(result).toEqual([
      { name: 'model', type: MenuI18nKey.Models, route: ApplicationRoute.Models },
      { name: 'application', type: MenuI18nKey.Applications, route: ApplicationRoute.Applications },
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

describe('Add Entities tab :: getRelevantModelsForAdapter ', () => {
  test('Should return empty array', () => {
    expect(getRelevantModelsForAdapter({}, data)).toEqual([]);
  });

  test('Should return array with adapter', () => {
    expect(getRelevantModelsForAdapter({ models: ['model'] }, data)).toEqual([data[0]]);
  });
});
