import { describe, test, expect } from 'vitest';
import { getClonedEntityName } from '../duplicate-entity';

describe('getClonedEntityName function', () => {
  test('should return an empty string when name is an empty string', () => {
    expect(getClonedEntityName('')).toBe('_(copy)');
  });

  test('should append "(copy)" to the name if the name does not already have the suffix', () => {
    expect(getClonedEntityName('entity')).toBe('entity_(copy)');
    expect(getClonedEntityName('test')).toBe('test_(copy)');
  });

  test('should return the name as is when it already has the "(copy)" suffix', () => {
    expect(getClonedEntityName('entity_(copy)')).toBe('entity_(copy)');
    expect(getClonedEntityName('test_(copy)')).toBe('test_(copy)');
  });

  test('should return the name as is when withoutSuffix is true', () => {
    expect(getClonedEntityName('entity', true)).toBe('entity');
    expect(getClonedEntityName('entity_(copy)', true)).toBe('entity_(copy)');
  });

  test('should return an empty string when name is undefined and withoutSuffix is true', () => {
    expect(getClonedEntityName(undefined, true)).toBe('');
  });

  test('should handle names with trailing spaces', () => {
    expect(getClonedEntityName('entity ')).toBe('entity _(copy)');
  });
});
