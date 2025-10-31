import { describe, test, expect } from 'vitest';
import { filterDisplayNames, filterNames } from '../filter-names';

describe('filterDisplayNames', () => {
  test('returns display names from entities', () => {
    const entities = [{ displayName: 'Entity1' }, { displayName: 'Entity2' }, { displayName: null }, {}];
    expect(filterDisplayNames(entities)).toEqual(['Entity1', 'Entity2']);
  });

  test('returns empty array if entities is undefined', () => {
    expect(filterDisplayNames(undefined)).toEqual([]);
  });

  test('returns empty array if entities is null', () => {
    expect(filterDisplayNames(null)).toEqual([]);
  });

  test('returns empty array if no displayName present', () => {
    const entities = [{}, { displayName: null }];
    expect(filterDisplayNames(entities)).toEqual([]);
  });

  test('returns array without current entity displayName', () => {
    const entities = [{ displayName: 'Entity1' }, { displayName: 'Entity2' }, { displayName: null }, {}];
    expect(filterDisplayNames(entities, 'Entity1')).toEqual(['Entity2']);
  });
});

describe('filterNames', () => {
  test('returns display names from entities', () => {
    const entities = [{ name: 'Entity1' }, { name: 'Entity2' }, { name: null }, {}];
    expect(filterNames(entities)).toEqual(['Entity1', 'Entity2']);
  });

  test('returns empty array if entities is undefined', () => {
    expect(filterNames(undefined)).toEqual([]);
  });

  test('returns empty array if entities is null', () => {
    expect(filterNames(null)).toEqual([]);
  });

  test('returns empty array if no displayName present', () => {
    const entities = [{}, { name: null }];
    expect(filterNames(entities)).toEqual([]);
  });

  test('returns array without current entity тame', () => {
    const entities = [{ name: 'Entity1' }, { name: 'Entity2' }, { name: null }, {}];
    expect(filterNames(entities, 'Entity1')).toEqual(['Entity2']);
  });
});
