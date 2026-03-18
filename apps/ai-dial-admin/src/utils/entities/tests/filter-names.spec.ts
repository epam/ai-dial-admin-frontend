import { describe, test, expect } from 'vitest';
import {
  filterDisplayNames,
  filterDisplayNamesWithVersions,
  filterNames,
  getNamesConfigurations,
} from '../filter-names';

describe('getNamesConfigurations', () => {
  test('should split names and versions correctly', () => {
    const input = ['ModelA___v1', 'ModelB___v2', 'ModelA___v2', 'ModelC___'];
    const result = getNamesConfigurations(input);
    expect(result.names).toEqual(['ModelA', 'ModelB', 'ModelA', 'ModelC']);
    expect(result.versionsMap).toEqual({
      ModelA: ['v1', 'v2'],
      ModelB: ['v2'],
      ModelC: [''],
    });
  });

  test('should handle empty input', () => {
    const result = getNamesConfigurations([]);
    expect(result.names).toEqual([]);
    expect(result.versionsMap).toEqual({});
  });

  test('should handle names without versions', () => {
    const input = ['ModelA___', 'ModelB___'];
    const result = getNamesConfigurations(input);
    expect(result.names).toEqual(['ModelA', 'ModelB']);
    expect(result.versionsMap).toEqual({ ModelA: [''], ModelB: [''] });
  });
});

describe('filterDisplayNamesWithVersions', () => {
  test('returns display names from entities and keeps same display name when current version differs', () => {
    const entities = [
      { displayName: 'Entity1', displayVersion: '1.0.0' },
      { displayName: 'Entity2', displayVersion: '2.0.0' },
      { displayName: 'Entity3' },
      { displayName: null },
      {},
    ];
    expect(filterDisplayNamesWithVersions(entities, { displayName: 'Entity2' })).toEqual([
      'Entity1___1.0.0',
      'Entity2___2.0.0',
      'Entity3___',
    ]);

    expect(
      filterDisplayNamesWithVersions(
        [
          { displayName: 'Entity1', displayVersion: '1.0.0' },
          { displayName: 'Entity2', displayVersion: '2.0.0' },
          { displayName: 'Entity3' },
          { displayName: null },
          {},
        ],
        { displayName: 'Entity2', displayVersion: '2.0.0' },
      ),
    ).toEqual(['Entity1___1.0.0', 'Entity3___']);
  });

  test('returns same display name when version differs from current model version', () => {
    const entities = [
      { displayName: 'Entity1', displayVersion: '1.0.0' },
      { displayName: 'Entity1', displayVersion: '1.0.1' },
      { displayName: 'Entity2', displayVersion: '2.0.0' },
    ];

    expect(filterDisplayNamesWithVersions(entities, { displayName: 'Entity1', displayVersion: '1.0.0' })).toEqual([
      'Entity1___1.0.1',
      'Entity2___2.0.0',
    ]);
  });

  test('returns same display name with empty version suffix when current model version differs', () => {
    const entities = [{ displayName: 'Entity1', displayVersion: '' }];

    expect(filterDisplayNamesWithVersions(entities, { displayName: 'Entity1', displayVersion: '1.0.0' })).toEqual([
      'Entity1___',
    ]);
  });

  test('returns all entity display names with versions when current model is not provided', () => {
    const entities = [
      { displayName: 'Entity1', displayVersion: '1.0.0' },
      { displayName: 'Entity2' },
      { displayName: null },
      {},
    ];

    expect(filterDisplayNamesWithVersions(entities)).toEqual(['Entity1___1.0.0', 'Entity2___']);
  });

  test('returns empty array if entities is undefined', () => {
    expect(filterDisplayNamesWithVersions(undefined)).toEqual([]);
  });

  test('returns empty array if entities is null', () => {
    expect(filterDisplayNamesWithVersions(null)).toEqual([]);
  });
});

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
