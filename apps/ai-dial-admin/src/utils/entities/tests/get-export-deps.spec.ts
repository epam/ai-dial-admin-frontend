import { EntityType } from '@/src/types/entity-type';
import { describe, expect, test } from 'vitest';
import { getAllAvailableDependencies } from '../get-export-deps';

describe('Export Config Utils :: getAllAvailableDependencies', () => {
  test('returns correct dependencies for ROLE', () => {
    const result = getAllAvailableDependencies(EntityType.ROLE);
    expect(result).toEqual([
      EntityType.MODEL,
      EntityType.APPLICATION,
      EntityType.TOOLSET,
      EntityType.ROUTE,
      EntityType.APPLICATION_TYPE_SCHEMA,
      EntityType.INTERCEPTOR,
    ]);
  });

  test('returns correct dependencies for KEY', () => {
    const result = getAllAvailableDependencies(EntityType.KEY);
    expect(result).toEqual([
      EntityType.ROLE,
      EntityType.MODEL,
      EntityType.APPLICATION,
      EntityType.APPLICATION_TYPE_SCHEMA,
      EntityType.INTERCEPTOR,
    ]);
  });

  test('returns correct dependencies for MODEL', () => {
    const result = getAllAvailableDependencies(EntityType.MODEL);
    expect(result).toEqual([EntityType.ADAPTER, EntityType.INTERCEPTOR]);
  });

  test('returns correct dependencies for APPLICATION_TYPE_SCHEMA', () => {
    const result = getAllAvailableDependencies(EntityType.APPLICATION_TYPE_SCHEMA);
    expect(result).toEqual([EntityType.INTERCEPTOR]);
  });

  test('returns correct dependencies for APPLICATION', () => {
    const result = getAllAvailableDependencies(EntityType.APPLICATION);
    expect(result).toEqual([EntityType.APPLICATION_TYPE_SCHEMA, EntityType.INTERCEPTOR]);
  });

  test('returns empty array for undefined input', () => {
    const result = getAllAvailableDependencies(undefined);
    expect(result).toEqual([]);
  });

  test('returns empty array for unsupported type', () => {
    const result = getAllAvailableDependencies('UNKNOWN' as EntityType);
    expect(result).toEqual([]);
  });
});
