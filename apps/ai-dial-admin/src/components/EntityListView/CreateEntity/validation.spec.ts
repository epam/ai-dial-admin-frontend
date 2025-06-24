import { ApplicationRoute } from '@/src/types/routes';
import { describe, expect, test } from 'vitest';
import { isValidEntity } from './validation';
describe('Utils :: isValidEntity', () => {
  test('Should check entity with version', () => {
    const res1 = isValidEntity(ApplicationRoute.Models, {});
    const res2 = isValidEntity(ApplicationRoute.Models, { displayName: 'displayName' });
    const res3 = isValidEntity(ApplicationRoute.Models, { displayName: 'displayName', name: 'name' });
    const res4 = isValidEntity(ApplicationRoute.Models, {
      displayName: 'displayName',
      name: 'name',
      adapter: 'adapter',
    });
    const res5 = isValidEntity(
      ApplicationRoute.Models,
      {
        displayName: 'displayName',
        name: 'name',
        endpoint: 'endpoint',
      },
      void 0,
      ['name'],
    );
    const res6 = isValidEntity(
      ApplicationRoute.Models,
      {
        displayName: 'displayName',
        name: 'name',
        adapter: 'adapter',
      },
      void 0,
      ['name2'],
    );

    expect(res1).toBeFalsy();
    expect(res2).toBeFalsy();
    expect(res3).toBeFalsy();
    expect(res4).toBeTruthy();
    expect(res5).toBeFalsy();
    expect(res6).toBeTruthy();
  });

  test('Should check Assistants', () => {
    const res1 = isValidEntity(ApplicationRoute.Assistants, {});
    const res2 = isValidEntity(ApplicationRoute.Assistants, { name: 'name', displayName: 'displayName' });
    const res3 = isValidEntity(ApplicationRoute.Assistants, { name: 'name', displayName: 'displayName' }, void 0, [
      'name',
    ]);
    const res4 = isValidEntity(ApplicationRoute.Assistants, { name: 'name', displayName: 'displayName' }, void 0, [
      'name2',
    ]);

    expect(res1).toBeFalsy();
    expect(res2).toBeTruthy();
    expect(res3).toBeFalsy();
    expect(res4).toBeTruthy();
  });

  test('Should check Routes', () => {
    const res1 = isValidEntity(ApplicationRoute.Routes, {});
    const res2 = isValidEntity(ApplicationRoute.Routes, { name: 'name', displayName: 'displayName' });
    const res3 = isValidEntity(ApplicationRoute.Routes, { name: 'name', displayName: 'displayName', paths: ['/path'] });
    const res4 = isValidEntity(ApplicationRoute.Routes, { name: 'name', displayName: 'displayName', paths: [''] });
    const res5 = isValidEntity(
      ApplicationRoute.Routes,
      { name: 'name', displayName: 'displayName', paths: ['path'] },
      void 0,
      ['name'],
    );
    const res6 = isValidEntity(
      ApplicationRoute.Routes,
      { name: 'name', displayName: 'displayName', paths: ['/path'] },
      void 0,
      ['name2'],
    );
    const res7 = isValidEntity(ApplicationRoute.Routes, { name: 'name', displayName: 'displayName', paths: ['path'] });
    const res8 = isValidEntity(ApplicationRoute.Routes, {
      name: 'name',
      displayName: 'displayName',
      paths: ['/path'],
      response: { status: 500 },
    });
    const res9 = isValidEntity(ApplicationRoute.Routes, {
      name: 'name',
      displayName: 'displayName',
      paths: ['/path'],
      response: { status: 5 },
    });

    expect(res1).toBeFalsy();
    expect(res2).toBeFalsy();
    expect(res3).toBeTruthy();
    expect(res4).toBeFalsy();
    expect(res5).toBeFalsy();
    expect(res6).toBeTruthy();
    expect(res7).toBeTruthy();
    expect(res8).toBeTruthy();
    expect(res9).toBeFalsy();
  });

  test('Should check Keys', () => {
    const res1 = isValidEntity(ApplicationRoute.Keys, {});
    const res2 = isValidEntity(ApplicationRoute.Keys, { key: 'key', name: 'key' });
    const res3 = isValidEntity(ApplicationRoute.Keys, { key: 'key', name: 'key', project: 'project' });
    const res4 = isValidEntity(ApplicationRoute.Keys, { key: 'key', name: 'key', project: 'project' }, void 0, ['key']);
    const res5 = isValidEntity(ApplicationRoute.Keys, { key: 'key', name: 'key', project: 'project' }, void 0, [
      'key2',
    ]);

    expect(res1).toBeFalsy();
    expect(res2).toBeFalsy();
    expect(res3).toBeTruthy();
    expect(res4).toBeFalsy();
    expect(res5).toBeTruthy();
  });

  test('Should check ApplicationRunners', () => {
    const res1 = isValidEntity(ApplicationRoute.ApplicationRunners, {});
    const res2 = isValidEntity(ApplicationRoute.ApplicationRunners, { $id: 'id' });

    expect(res1).toBeFalsy();
    expect(res2).toBeTruthy();
  });

  test('Should check Applications', () => {
    const res1 = isValidEntity(ApplicationRoute.Applications, {});
    const res2 = isValidEntity(ApplicationRoute.Applications, { name: 'name', displayName: 'displayName' });
    const res3 = isValidEntity(ApplicationRoute.Applications, {
      name: 'name',
      displayName: 'displayName',
      customAppSchemaId: 'customAppSchemaId',
    });
    const res4 = isValidEntity(
      ApplicationRoute.Applications,
      {
        name: 'name',
        displayName: 'displayName',
        customAppSchemaId: 'customAppSchemaId',
      },
      void 0,
      ['name'],
    );
    const res5 = isValidEntity(
      ApplicationRoute.Applications,
      {
        name: 'name',
        displayName: 'displayName',
        customAppSchemaId: 'customAppSchemaId',
      },
      void 0,
      ['name2'],
    );

    expect(res1).toBeFalsy();
    expect(res2).toBeFalsy();
    expect(res3).toBeTruthy();
    expect(res4).toBeFalsy();
    expect(res5).toBeTruthy();
  });

  test('Should check Adapters', () => {
    const res1 = isValidEntity(ApplicationRoute.Adapters, {});
    const res2 = isValidEntity(ApplicationRoute.Adapters, { name: 'name', displayName: 'displayName' });
    const res3 = isValidEntity(ApplicationRoute.Adapters, {
      name: 'name',
      displayName: 'displayName',
      baseEndpoint: 'baseEndpoint',
    });
    const res4 = isValidEntity(
      ApplicationRoute.Adapters,
      {
        name: 'name',
        displayName: 'displayName',
        baseEndpoint: 'baseEndpoint',
      },
      void 0,
      ['name'],
    );
    const res5 = isValidEntity(
      ApplicationRoute.Adapters,
      {
        name: 'name',
        displayName: 'displayName',
        baseEndpoint: 'baseEndpoint',
      },
      void 0,
      ['name2'],
    );

    expect(res1).toBeFalsy();
    expect(res2).toBeFalsy();
    expect(res3).toBeTruthy();
    expect(res4).toBeFalsy();
    expect(res5).toBeTruthy();
  });

  test('Should check simple entity', () => {
    const res1 = isValidEntity(ApplicationRoute.Roles, {});
    const res2 = isValidEntity(ApplicationRoute.Roles, { name: 'name' });
    const res3 = isValidEntity(ApplicationRoute.Roles, { name: 'name' }, true);
    const res4 = isValidEntity(ApplicationRoute.Roles, { name: 'name' }, void 0, ['name1']);
    const res5 = isValidEntity(ApplicationRoute.Roles, { name: 'name' }, void 0, ['name']);

    expect(res1).toBeFalsy();
    expect(res2).toBeTruthy();
    expect(res3).toBeFalsy();
    expect(res4).toBeTruthy();
    expect(res5).toBeFalsy();
  });
});
