import { describe, expect, test } from 'vitest';

import { SOURCE_TYPE } from '@/src/components/SourceField/types';
import { ApplicationRoute } from '@/src/types/routes';
import { getInitialPlatformEntity, toPlatformInitialValues } from '../utils';

describe('getInitialPlatformEntity', () => {
  test.each([ApplicationRoute.PlatformModels, ApplicationRoute.PlatformRouters, ApplicationRoute.PlatformRoutes])(
    'starts %s with no roles',
    (view) => {
      expect(getInitialPlatformEntity(view)).toEqual({ name: '', description: '', userRoles: [] });
    },
  );

  test('starts a translator with only a name', () => {
    expect(getInitialPlatformEntity(ApplicationRoute.PlatformTranslators)).toEqual({ name: '' });
  });

  test.each([ApplicationRoute.AssetsApplications, ApplicationRoute.AssetsToolsets])(
    'starts %s with snake_case roles',
    (view) => {
      expect(getInitialPlatformEntity(view)).toEqual({ name: '', description: '', user_roles: [] });
    },
  );

  test('falls back to a name and a description', () => {
    expect(getInitialPlatformEntity(ApplicationRoute.PlatformInterceptors)).toEqual({ name: '', description: '' });
  });

  test('lets the seed values win over the defaults', () => {
    expect(getInitialPlatformEntity(ApplicationRoute.PlatformModels, { description: 'seeded' })).toEqual({
      name: '',
      description: 'seeded',
      userRoles: [],
    });
  });
});

describe('toPlatformInitialValues', () => {
  test('returns nothing for no seed', () => {
    expect(toPlatformInitialValues(undefined)).toBeUndefined();
  });

  test('maps a schema source to application_type_schema_id and drops the source', () => {
    const result = toPlatformInitialValues({
      source: { $type: SOURCE_TYPE.SCHEMA, applicationTypeSchemaId: 'runner-1' },
      applicationProperties: { a: 1 },
    });

    expect(result).toEqual({ applicationProperties: { a: 1 }, application_type_schema_id: 'runner-1' });
    expect(result).not.toHaveProperty('source');
  });

  test('drops a non-schema source without inventing a schema id', () => {
    const result = toPlatformInitialValues({ source: { $type: SOURCE_TYPE.ENDPOINTS }, description: 'x' });

    expect(result).toEqual({ description: 'x' });
  });
});
