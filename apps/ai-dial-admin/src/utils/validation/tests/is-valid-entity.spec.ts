import { ApplicationRoute } from '@/src/types/routes';
import { isValidEntity } from '@/src/utils/validation/is-valid-entity';
import { describe, expect, test } from 'vitest';

describe('Utils :: isValidEntity', () => {
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
});
