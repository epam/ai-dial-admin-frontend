import { describe, it, expect } from 'vitest';
import { filterDisplayNames, filterNames } from '../filter-names';

describe('filterDisplayNames', () => {
  it('returns display names from entities', () => {
    const entities = [{ displayName: 'Entity1' }, { displayName: 'Entity2' }, { displayName: null }, {}];
    expect(filterDisplayNames(entities)).toEqual(['Entity1', 'Entity2']);
  });

  it('returns empty array if entities is undefined', () => {
    expect(filterDisplayNames(undefined)).toEqual([]);
  });

  it('returns empty array if entities is null', () => {
    expect(filterDisplayNames(null)).toEqual([]);
  });

  it('returns empty array if no displayName present', () => {
    const entities = [{}, { displayName: null }];
    expect(filterDisplayNames(entities)).toEqual([]);
  });
});

describe('filterNames', () => {
  it('returns display names from entities', () => {
    const entities = [{ name: 'Entity1' }, { name: 'Entity2' }, { name: null }, {}];
    expect(filterNames(entities)).toEqual(['Entity1', 'Entity2']);
  });

  it('returns empty array if entities is undefined', () => {
    expect(filterNames(undefined)).toEqual([]);
  });

  it('returns empty array if entities is null', () => {
    expect(filterNames(null)).toEqual([]);
  });

  it('returns empty array if no displayName present', () => {
    const entities = [{}, { name: null }];
    expect(filterNames(entities)).toEqual([]);
  });
});
