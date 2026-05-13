import { describe, test, expect, vi } from 'vitest';
import { getColumnsByParameter, getCurrentAndRollbackEntities } from '../utils';

import { EntityParameterKeys } from '@/src/components/ActivityAudit/constants';
import { ActivityAuditResourceType } from '@/src/types/activity-audit';
import * as constants from '@/src/components/ActivityAudit/EntityGrid/constants';

type EntitiesGridData = {
  name?: string;
  key?: string;
  $id?: string;
  [key: string]: any;
};

describe('getCurrentAndRollbackEntities', () => {
  const fallbackEntity: EntitiesGridData = {
    name: 'fallback',
    key: 'fallback-key',
    $id: 'fallback-id',
    other: 'data',
  };

  const matchingEntity: EntitiesGridData = {
    name: 'match',
    key: 'match-key',
    $id: 'match-id',
    other: 'info',
  };

  test('should return fallback entity when entity is not found in current or rollback arrays', () => {
    const result = getCurrentAndRollbackEntities(fallbackEntity, 'nonexistent-id');
    expect(result.current).toEqual(fallbackEntity);
    expect(result.rollback).toEqual(fallbackEntity);
  });

  test('should find entity by name', () => {
    const entities = [{ ...matchingEntity, name: 'target-name' }];
    const result = getCurrentAndRollbackEntities(fallbackEntity, 'target-name', entities, []);
    expect(result.current).toEqual(entities[0]);
    expect(result.rollback).toBeUndefined();
  });

  test('should find entity by key', () => {
    const entities = [{ ...matchingEntity, key: 'target-key' }];
    const result = getCurrentAndRollbackEntities(fallbackEntity, 'target-key', [], entities);
    expect(result.current).toBeUndefined();
    expect(result.rollback).toEqual(entities[0]);
  });

  test('should find entity by $id', () => {
    const entities = [{ ...matchingEntity, $id: 'target-id' }];
    const result = getCurrentAndRollbackEntities(fallbackEntity, 'target-id', entities, entities);
    expect(result.current).toEqual(entities[0]);
    expect(result.rollback).toEqual(entities[0]);
  });

  test('should return undefined if no fallback is provided and list is undefined', () => {
    const result = getCurrentAndRollbackEntities(undefined as any, 'some-id');
    expect(result.current).toBeUndefined();
    expect(result.rollback).toBeUndefined();
  });

  test('should skip falsy items in entities list', () => {
    const entities = [null, undefined, false, { name: 'valid' }] as any;
    const result = getCurrentAndRollbackEntities(fallbackEntity, 'valid', entities, []);
    expect(result.current).toEqual({ name: 'valid' });
  });
});

describe('getColumnsByParameter', () => {
  const mockTranslate = (key: string) => `translated:${key}`;

  test('returns ROLE_LIMITS_DIFF_COLUMNS when parameter is ROLES and index is 1', () => {
    const result = getColumnsByParameter(EntityParameterKeys.ROLES, 1);
    expect(result).toEqual(constants.ROLE_LIMITS_DIFF_COLUMNS);
  });

  test('returns ROLE_LIMITS_DIFF_COLUMNS when parameter is ROLES and type is ROLE', () => {
    const result = getColumnsByParameter(
      EntityParameterKeys.ROLES,
      undefined,
      undefined,
      ActivityAuditResourceType.ROLE,
    );
    expect(result).toEqual(constants.ROLE_LIMITS_DIFF_COLUMNS);
  });

  test('returns INTERCEPTORS_DIFF_COLUMNS when parameter is INTERCEPTORS', () => {
    const result = getColumnsByParameter(EntityParameterKeys.INTERCEPTORS);
    expect(result).toEqual(constants.INTERCEPTORS_DIFF_COLUMNS);
  });

  test.each([
    EntityParameterKeys.APPLICATIONS,
    EntityParameterKeys.ENTITIES,
    EntityParameterKeys.KEYS,
    EntityParameterKeys.MODELS,
    EntityParameterKeys.DEPENDENCIES,
  ])('returns ENTITIES_DIFF_COLUMNS when parameter is %s', (param) => {
    const result = getColumnsByParameter(param);
    expect(result).toEqual(constants.ENTITIES_DIFF_COLUMNS);
  });

  test('returns ENTITIES_DIFF_COLUMNS when parameter is ROLES and type is KEY', () => {
    const result = getColumnsByParameter(
      EntityParameterKeys.ROLES,
      undefined,
      undefined,
      ActivityAuditResourceType.KEY,
    );
    expect(result).toEqual(constants.ENTITIES_DIFF_COLUMNS);
  });

  test('returns RESOURCE_DIFF_COLUMNS with translation fallback for unknown parameter', () => {
    const resourceColumnsSpy = vi.spyOn(constants, 'RESOURCE_DIFF_COLUMNS');
    getColumnsByParameter('UNKNOWN_PARAM' as any, undefined, mockTranslate);
    expect(resourceColumnsSpy).toHaveBeenCalled();
  });
});

describe('Activity audit :: RESOURCE_DIFF_COLUMNS cellRendererSelector for env-var rows', () => {
  const t = (k: string) => k;
  const getValueSelector = (parameter: EntityParameterKeys) => {
    const cols = constants.RESOURCE_DIFF_COLUMNS(t, parameter, undefined);
    const valueCol = cols.find((c) => c.field === 'value');
    return (valueCol?.cellRendererSelector as Function) || (() => undefined);
  };

  test.each(['secure_content', 'secure_file', 'content'])(
    'returns EnvVarValueCellRenderer for envValue row with mountType=%s',
    (mountType) => {
      const result = getValueSelector(EntityParameterKeys.METADATA)({
        data: { parameter: 'envValue', mountType },
        value: 'v',
      });
      expect(result?.component?.displayName || result?.component?.name).toMatch(/EnvVarValueCellRenderer/);
    },
  );

  test('returns undefined for non-envValue rows in METADATA section', () => {
    const result = getValueSelector(EntityParameterKeys.METADATA)({
      data: { parameter: 'envName', mountType: 'secure_content' },
      value: 'API_KEY',
    });
    expect(result).toBeUndefined();
  });

  test('returns undefined for env-var-like row when parameter is not METADATA', () => {
    const result = getValueSelector(EntityParameterKeys.KEYS)({
      data: { parameter: 'envValue', mountType: 'secure_content' },
      value: 'v',
    });
    expect(result).toBeUndefined();
  });
});
