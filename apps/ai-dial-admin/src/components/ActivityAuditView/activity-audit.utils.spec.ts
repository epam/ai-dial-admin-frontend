import { ActivityAuditDiff } from '@/src/models/dial/activity-audit';
import { DialRoleLimits } from '@/src/models/dial/base-entity';
import { DiffStatus } from '@/src/types/activity-audit';
import { EntityParameterKeys } from './activity-audit';
import {
  compareInterceptors,
  compareRoleLimits,
  compareSimpleTypes,
  createSectionFromDiffs,
  fillInterceptors,
  fillRoleLimits,
  fillSimpleTypes,
  generateCurrentResource,
  getDiffCount,
  isPathKey,
  isSimpleValueAddedOrRemoved,
  isSimpleValueChanged,
} from './activity-audit.utils';

describe('Activity audit :: generateCurrentResource ', () => {
  it('should return only empty properties array', () => {
    const result = generateCurrentResource(undefined, undefined);
    expect(result).toEqual({ properties: [] });
  });

  it('should return same array if current and compare are identical', () => {
    const current = { name: 'John', age: '30' };
    const compare = { name: 'John', age: '30' };
    const result = generateCurrentResource(current, compare);
    expect(result).toEqual({
      properties: [
        { parameter: 'name', value: 'John' },
        { parameter: 'age', value: '30' },
      ],
    });
  });

  it('should return an ADD and REMOVE diff if current has a key and compare does not', () => {
    const current = { name: 'John' };
    const compare = { age: '30' };
    const result = generateCurrentResource(current, compare);
    expect(result).toEqual({
      properties: [
        { parameter: 'name', value: '', status: DiffStatus.REMOVED },
        { parameter: 'age', value: '30', status: DiffStatus.ADDED },
      ],
    });
  });

  it('should return a CHANGE diff if current and compare have different values for the same key', () => {
    const current = { name: 'John', age: '30' };
    const compare = { name: 'Doe', age: '30' };
    const result = generateCurrentResource(current, compare);
    expect(result).toEqual({
      properties: [
        { parameter: 'name', value: 'Doe', status: DiffStatus.CHANGED },
        { parameter: 'age', value: '30' },
      ],
    });
  });

  it('should return diffs for multiple keys with mixed values', () => {
    const current = { name: 'John', age: '30', country: 'US' };
    const compare = { name: 'John', age: '31', city: 'NY' };
    const result = generateCurrentResource(current, compare);
    expect(result).toEqual({
      properties: [
        { parameter: 'name', value: 'John' },
        { parameter: 'age', value: '31', status: DiffStatus.CHANGED },
        { parameter: 'city', value: 'NY', status: DiffStatus.ADDED },
        { parameter: 'country', value: '', status: DiffStatus.REMOVED },
      ],
    });
  });

  it('should return values from compare if current is null', () => {
    const compare = { name: 'Doe', age: '25' };
    const result = generateCurrentResource(null, compare);
    expect(result).toEqual({
      properties: [
        { parameter: 'name', value: 'Doe' },
        { parameter: 'age', value: '25' },
      ],
    });
  });
});

describe('Activity audit :: compareSimpleTypes', () => {
  it('should push REMOVE when val1 is defined and val2 is null', () => {
    const diffs = [];
    compareSimpleTypes(diffs, 'key', 'value1', void 0);
    expect(diffs).toEqual([{ parameter: 'key', value: '', status: DiffStatus.REMOVED }]);
  });

  it('should push ADD when val1 is null and val2 is defined', () => {
    const diffs = [];
    compareSimpleTypes(diffs, 'key', void 0, 'value2');
    expect(diffs).toEqual([{ parameter: 'key', value: 'value2', status: DiffStatus.ADDED }]);
  });

  it('should push CHANGE when val1 and val2 are different', () => {
    const diffs = [];
    compareSimpleTypes(diffs, 'key', 'old', 'new');
    expect(diffs).toEqual([{ parameter: 'key', value: 'new', status: DiffStatus.CHANGED }]);
  });

  it('should push unchanged value when val1 and val2 are the same', () => {
    const diffs = [];
    compareSimpleTypes(diffs, 'key', 'same', 'same');
    expect(diffs).toEqual([{ parameter: 'key', value: 'same' }]);
  });

  it('should handle number types and push CHANGE if different', () => {
    const diffs = [];
    compareSimpleTypes(diffs, 'count', 1, 2);
    expect(diffs).toEqual([{ parameter: 'count', value: '2', status: DiffStatus.CHANGED }]);
  });

  it('should handle boolean types and push CHANGE if different', () => {
    const diffs = [];
    compareSimpleTypes(diffs, 'enabled', true, false);
    expect(diffs).toEqual([{ parameter: 'enabled', value: 'false', status: DiffStatus.CHANGED }]);
  });

  it('should push unchanged value for boolean true === true', () => {
    const diffs = [];
    compareSimpleTypes(diffs, 'flag', true, true);
    expect(diffs).toEqual([{ parameter: 'flag', value: 'true' }]);
  });

  it('should push unchanged value for number 42 === 42', () => {
    const diffs = [];
    compareSimpleTypes(diffs, 'answer', 42, 42);
    expect(diffs).toEqual([{ parameter: 'answer', value: '42' }]);
  });
});

describe('Activity audit :: fillSimpleTypes', () => {
  it('should push string value as-is', () => {
    const diffs = [];
    fillSimpleTypes(diffs, 'name', 'John');
    expect(diffs).toEqual([{ parameter: 'name', value: 'John' }]);
  });

  it('should convert number to string', () => {
    const diffs = [];
    fillSimpleTypes(diffs, 'age', 30);
    expect(diffs).toEqual([{ parameter: 'age', value: '30' }]);
  });

  it('should convert boolean true to string', () => {
    const diffs = [];
    fillSimpleTypes(diffs, 'active', true);
    expect(diffs).toEqual([{ parameter: 'active', value: 'true' }]);
  });

  it('should convert boolean false to string', () => {
    const diffs = [];
    fillSimpleTypes(diffs, 'active', false);
    expect(diffs).toEqual([{ parameter: 'active', value: 'false' }]);
  });

  it('should push empty string when value is undefined', () => {
    const diffs = [];
    fillSimpleTypes(diffs, 'optional', undefined);
    expect(diffs).toEqual([{ parameter: 'optional', value: '' }]);
  });
});

describe('Activity audit :: compareInterceptors', () => {
  it('should push REMOVE when val1 item is defined and val2 item is null', () => {
    const diffs = [];
    compareInterceptors(diffs, ['a', 'b'], ['a', null as unknown as string]);
    expect(diffs).toEqual([
      { parameter: '0', value: 'a' },
      { parameter: '1', value: '', status: DiffStatus.REMOVED },
    ]);
  });

  it('should push ADD when val1 item is null and val2 item is defined', () => {
    const diffs = [];
    compareInterceptors(diffs, ['a', null as unknown as string], ['a', 'b']);
    expect(diffs).toEqual([
      { parameter: '0', value: 'a' },
      { parameter: '1', value: 'b', status: DiffStatus.ADDED },
    ]);
  });

  it('should push CHANGE when val1 and val2 items are different', () => {
    const diffs = [];
    compareInterceptors(diffs, ['old', 'same'], ['new', 'same']);
    expect(diffs).toEqual([
      { parameter: '0', value: 'new', status: DiffStatus.CHANGED },
      { parameter: '1', value: 'same' },
    ]);
  });

  it('should push unchanged values when val1 and val2 items are the same', () => {
    const diffs = [];
    compareInterceptors(diffs, ['same', 'same'], ['same', 'same']);
    expect(diffs).toEqual([
      { parameter: '0', value: 'same' },
      { parameter: '1', value: 'same' },
    ]);
  });

  it('should handle val1 longer than val2 with REMOVEs', () => {
    const diffs = [];
    compareInterceptors(diffs, ['one', 'two', 'three'], ['one']);
    expect(diffs).toEqual([
      { parameter: '0', value: 'one' },
      { parameter: '1', value: '', status: DiffStatus.REMOVED },
      { parameter: '2', value: '', status: DiffStatus.REMOVED },
    ]);
  });

  it('should handle val2 longer than val1 with ADDs', () => {
    const diffs = [];
    compareInterceptors(diffs, ['one'], ['one', 'two', 'three']);
    expect(diffs).toEqual([
      { parameter: '0', value: 'one' },
      { parameter: '1', value: 'two', status: DiffStatus.ADDED },
      { parameter: '2', value: 'three', status: DiffStatus.ADDED },
    ]);
  });

  it('should handle empty arrays', () => {
    const diffs = [];
    compareInterceptors(diffs, [], []);
    expect(diffs).toEqual([]);
  });
});

describe('Activity audit :: fillInterceptors', () => {
  it('should fill diffs with index and value pairs from array', () => {
    const diffs = [];
    fillInterceptors(diffs, ['one', 'two']);
    expect(diffs).toEqual([
      { parameter: '0', value: 'one' },
      { parameter: '1', value: 'two' },
    ]);
  });

  it('should convert falsy string values like empty string to empty string', () => {
    const diffs = [];
    fillInterceptors(diffs, ['value', '']);
    expect(diffs).toEqual([
      { parameter: '0', value: 'value' },
      { parameter: '1', value: '' },
    ]);
  });

  it('should replace null and undefined with empty strings', () => {
    const diffs = [];
    fillInterceptors(diffs, ['a', null as unknown as string, undefined as unknown as string]);
    expect(diffs).toEqual([
      { parameter: '0', value: 'a' },
      { parameter: '1', value: '' },
      { parameter: '2', value: '' },
    ]);
  });

  it('should do nothing when value is an empty array', () => {
    const diffs = [];
    fillInterceptors(diffs, []);
    expect(diffs).toEqual([]);
  });

  it('should do nothing when value is undefined', () => {
    const diffs = [];
    fillInterceptors(diffs, undefined as unknown as string[]);
    expect(diffs).toEqual([]);
  });

  it('should work with single-element array', () => {
    const diffs = [];
    fillInterceptors(diffs, ['only']);
    expect(diffs).toEqual([{ parameter: '0', value: 'only' }]);
  });
});

describe('Activity audit :: compareRoleLimits', () => {
  it('should push REMOVE when val1 has key and val2 does not', () => {
    const diffs = [];
    const val1 = { admin: { maxCalls: 5, maxDuration: 10 } };
    const val2 = {};
    compareRoleLimits(diffs, val1, val2);
    expect(diffs).toEqual([{ parameter: '', value: '', status: DiffStatus.REMOVED }]);
  });

  it('should push ADD when val1 does not have key and val2 does', () => {
    const diffs = [];
    const val1 = {};
    const val2 = { user: { maxCalls: 3, maxDuration: 15 } };
    compareRoleLimits(diffs, val1, val2);
    expect(diffs).toEqual([{ parameter: 'user', value: 'maxCalls: 3, maxDuration: 15', status: DiffStatus.ADDED }]);
  });

  it('should push CHANGE when val1 and val2 have same key but different values', () => {
    const diffs = [];
    const val1 = { guest: { maxCalls: 1, maxDuration: 5 } };
    const val2 = { guest: { maxCalls: 2, maxDuration: 5 } };
    compareRoleLimits(diffs, val1, val2);
    expect(diffs).toEqual([{ parameter: 'guest', value: 'maxCalls: 2, maxDuration: 5', status: DiffStatus.CHANGED }]);
  });

  it('should push unchanged value when val1 and val2 are equal', () => {
    const diffs = [];
    const val1 = { manager: { maxCalls: 4, maxDuration: 20 } };
    const val2 = { manager: { maxCalls: 4, maxDuration: 20 } };
    compareRoleLimits(diffs, val1, val2);
    expect(diffs).toEqual([{ parameter: 'manager', value: 'maxCalls: 4, maxDuration: 20' }]);
  });

  it('should handle empty val1 and val2', () => {
    const diffs = [];
    compareRoleLimits(diffs, {}, {});
    expect(diffs).toEqual([]);
  });

  it('should handle val1 or val2 being null or undefined', () => {
    const diffs1 = [];
    compareRoleLimits(diffs1, null as any, { user: { maxCalls: 1, maxDuration: 1 } });
    expect(diffs1).toEqual([{ parameter: 'user', value: 'maxCalls: 1, maxDuration: 1', status: DiffStatus.ADDED }]);

    const diffs2 = [];
    compareRoleLimits(diffs2, { user: { maxCalls: 1, maxDuration: 1 } }, null as any);
    expect(diffs2).toEqual([{ parameter: '', value: '', status: DiffStatus.REMOVED }]);
  });
});

describe('Activity audit :: fillRoleLimits', () => {
  it('should push entries with parameter and formatted value', () => {
    const diffs = [];
    const value = {
      admin: { maxCalls: 10, maxDuration: 60 },
      user: { maxCalls: 5, maxDuration: 30 },
    };
    fillRoleLimits(diffs, value);
    expect(diffs).toEqual([
      { parameter: 'admin', value: 'maxCalls: 10, maxDuration: 60' },
      { parameter: 'user', value: 'maxCalls: 5, maxDuration: 30' },
    ]);
  });

  it('should handle single key object', () => {
    const diffs = [];
    const value = {
      guest: { maxCalls: 1, maxDuration: 5 },
    };
    fillRoleLimits(diffs, value);
    expect(diffs).toEqual([{ parameter: 'guest', value: 'maxCalls: 1, maxDuration: 5' }]);
  });

  it('should sort keys alphabetically', () => {
    const diffs = [];
    const value = {
      zeta: { maxCalls: 3, maxDuration: 3 },
      alpha: { maxCalls: 1, maxDuration: 1 },
    };
    fillRoleLimits(diffs, value);
    expect(diffs).toEqual([
      { parameter: 'alpha', value: 'maxCalls: 1, maxDuration: 1' },
      { parameter: 'zeta', value: 'maxCalls: 3, maxDuration: 3' },
    ]);
  });

  it('should do nothing if value is an empty object', () => {
    const diffs = [];
    fillRoleLimits(diffs, {});
    expect(diffs).toEqual([]);
  });

  it('should handle value being null or undefined gracefully', () => {
    const diffs1 = [];
    fillRoleLimits(diffs1, null as unknown as Record<string, DialRoleLimits>);
    expect(diffs1).toEqual([]);

    const diffs2 = [];
    fillRoleLimits(diffs2, undefined as unknown as Record<string, DialRoleLimits>);
    expect(diffs2).toEqual([]);
  });
});

describe('Activity audit :: createSectionFromDiffs', () => {
  it('should create sections with default and role limits under ROLES', () => {
    const current: Record<string, ActivityAuditDiff[]> = {
      [EntityParameterKeys.DEFAULT_ROLE_LIMIT]: [{ parameter: 'default', value: '10' }],
      [EntityParameterKeys.ROLE_LIMITS]: [{ parameter: 'role1', value: '5' }],
    };
    const compare: Record<string, ActivityAuditDiff[]> = {
      [EntityParameterKeys.DEFAULT_ROLE_LIMIT]: [{ parameter: 'default', value: '15' }],
      [EntityParameterKeys.ROLE_LIMITS]: [{ parameter: 'role1', value: '7' }],
    };

    const result = createSectionFromDiffs(current, compare);

    expect(result[EntityParameterKeys.ROLES]).toHaveLength(2);
    expect(result[EntityParameterKeys.ROLES][0]).toEqual({
      current: current[EntityParameterKeys.DEFAULT_ROLE_LIMIT],
      compare: compare[EntityParameterKeys.DEFAULT_ROLE_LIMIT],
    });
    expect(result[EntityParameterKeys.ROLES][1]).toEqual({
      current: current[EntityParameterKeys.ROLE_LIMITS],
      compare: compare[EntityParameterKeys.ROLE_LIMITS],
    });
  });

  it('should create sections for UPSTREAMS keys correctly', () => {
    const current: Record<string, ActivityAuditDiff[]> = {
      upstreams1: [{ parameter: 'u1', value: 'val1' }],
      upstreams2: [{ parameter: 'u2', value: 'val2' }],
    };
    const compare: Record<string, ActivityAuditDiff[]> = {
      upstreams1: [{ parameter: 'u1', value: 'val1_changed' }],
    };

    const result = createSectionFromDiffs(current, compare);

    expect(result[EntityParameterKeys.UPSTREAMS]).toHaveLength(2);
    expect(result[EntityParameterKeys.UPSTREAMS]).toContainEqual({
      current: current['upstreams1'],
      compare: compare['upstreams1'],
    });
    expect(result[EntityParameterKeys.UPSTREAMS]).toContainEqual({
      current: current['upstreams2'],
      compare: undefined,
    });
  });

  it('should create sections for other keys when arrays exist', () => {
    const current: Record<string, ActivityAuditDiff[]> = {
      [EntityParameterKeys.PROPERTIES]: [{ parameter: 'prop1', value: 'val1' }],
      [EntityParameterKeys.FEATURES]: [],
      [EntityParameterKeys.INTERCEPTORS]: [{ parameter: 'int1', value: 'val1' }],
    };
    const compare: Record<string, ActivityAuditDiff[]> = {
      [EntityParameterKeys.PROPERTIES]: [{ parameter: 'prop1', value: 'val2' }],
      [EntityParameterKeys.FEATURES]: [{ parameter: 'feat1', value: 'valF' }],
      [EntityParameterKeys.INTERCEPTORS]: [],
    };

    const result = createSectionFromDiffs(current, compare);

    expect(result[EntityParameterKeys.PROPERTIES]).toEqual([
      { current: current[EntityParameterKeys.PROPERTIES], compare: compare[EntityParameterKeys.PROPERTIES] },
    ]);
    expect(result[EntityParameterKeys.FEATURES]).toEqual([
      { current: [], compare: compare[EntityParameterKeys.FEATURES] },
    ]);
    expect(result[EntityParameterKeys.INTERCEPTORS]).toEqual([
      { current: current[EntityParameterKeys.INTERCEPTORS], compare: [] },
    ]);
  });

  it('should omit sections if both current and compare are empty or undefined', () => {
    const current = {};
    const compare = {};
    const result = createSectionFromDiffs(current, compare);
    expect(result).toEqual({});
  });
});

describe('Activity audit :: getDiffCount', () => {
  const createItem = (status?: DiffStatus) => ({ parameter: 'param', value: 'val', status });

  it('should count ADD statuses correctly', () => {
    const sections = [
      {
        section1: [createItem(DiffStatus.ADDED), createItem(DiffStatus.ADDED)],
        section2: [createItem(DiffStatus.REMOVED)],
      },
      {
        section3: [createItem(DiffStatus.ADDED)],
      },
    ];

    const count = getDiffCount(sections, DiffStatus.ADDED);
    expect(count).toBe(3);
  });

  it('should count REMOVE statuses correctly', () => {
    const sections = [
      {
        s1: [createItem(DiffStatus.REMOVED), createItem(DiffStatus.ADDED)],
      },
      {
        s2: [createItem(DiffStatus.REMOVED), createItem(DiffStatus.REMOVED)],
      },
    ];

    const count = getDiffCount(sections, DiffStatus.REMOVED);
    expect(count).toBe(3);
  });

  it('should count CHANGE statuses correctly and divide by 2', () => {
    const sections = [
      {
        s1: [createItem(DiffStatus.CHANGED), createItem(DiffStatus.CHANGED), createItem(DiffStatus.CHANGED)],
      },
      {
        s2: [createItem(DiffStatus.CHANGED)],
      },
    ];

    const count = getDiffCount(sections, DiffStatus.CHANGED);
    expect(count).toBe(2);
  });

  it('should return 0 if no matching status found', () => {
    const sections = [
      {
        s1: [createItem(DiffStatus.ADDED), createItem(DiffStatus.ADDED)],
      },
    ];
    const count = getDiffCount(sections, DiffStatus.REMOVED);
    expect(count).toBe(0);
  });

  it('should return 0 when no status argument provided', () => {
    const sections = [
      {
        s1: [createItem(DiffStatus.ADDED)],
      },
    ];
    const count = getDiffCount(sections);
    expect(count).toBe(0);
  });

  it('should ignore items without status', () => {
    const sections = [
      {
        s1: [createItem(), createItem(DiffStatus.ADDED)],
      },
    ];
    const count = getDiffCount(sections, DiffStatus.ADDED);
    expect(count).toBe(1);
  });
});

describe('Activity audit :: isSimpleValueAddedOrRemoved', () => {
  it('should return true when value1 is string and value2 is empty string', () => {
    expect(isSimpleValueAddedOrRemoved('hello', '')).toBe(true);
  });

  it('should return true when value1 is number and value2 is empty string', () => {
    expect(isSimpleValueAddedOrRemoved(42, '')).toBe(true);
  });

  it('should return true when value1 is boolean true and value2 is empty string', () => {
    expect(isSimpleValueAddedOrRemoved(true, '')).toBe(true);
  });

  it('should return false when value1 is empty string and value2 is empty string', () => {
    expect(isSimpleValueAddedOrRemoved('', '')).toBe(false);
  });

  it('should return false when value1 is undefined and value2 is empty string', () => {
    expect(isSimpleValueAddedOrRemoved(undefined, '')).toBe(false);
  });

  it('should return false when value1 and value2 are different non-empty strings', () => {
    expect(isSimpleValueAddedOrRemoved('hello', 'world')).toBe(false);
  });

  it('should return false when value1 and value2 are different numbers', () => {
    expect(isSimpleValueAddedOrRemoved(1, 2)).toBe(false);
  });

  it('should return false when value1 and value2 are different booleans', () => {
    expect(isSimpleValueAddedOrRemoved(true, false)).toBe(false);
  });

  it('should return false when value1 and value2 are equal non-empty strings', () => {
    expect(isSimpleValueAddedOrRemoved('test', 'test')).toBe(false);
  });

  it('should return false when value1 and value2 are equal numbers', () => {
    expect(isSimpleValueAddedOrRemoved(5, 5)).toBe(false);
  });

  it('should return false when value1 and value2 are equal booleans', () => {
    expect(isSimpleValueAddedOrRemoved(true, true)).toBe(false);
  });
});

describe('Activity audit :: isSimpleValueChanged', () => {
  it('should return true when value1 and value2 are different strings', () => {
    expect(isSimpleValueChanged('hello', 'world')).toBe(true);
  });

  it('should return true when value1 and value2 are different numbers', () => {
    expect(isSimpleValueChanged(1, 2)).toBe(true);
  });

  it('should return true when value1 and value2 are different booleans', () => {
    expect(isSimpleValueChanged(true, false)).toBe(true);
  });

  it('should return false when value1 and value2 are equal strings', () => {
    expect(isSimpleValueChanged('test', 'test')).toBe(false);
  });

  it('should return false when value1 and value2 are equal numbers', () => {
    expect(isSimpleValueChanged(5, 5)).toBe(false);
  });

  it('should return false when value1 and value2 are equal booleans', () => {
    expect(isSimpleValueChanged(false, false)).toBe(false);
  });

  it('should return false when value1 is undefined and value2 is defined', () => {
    expect(isSimpleValueChanged(undefined, 123)).toBe(false);
  });

  it('should return false when value1 is defined and value2 is undefined', () => {
    expect(isSimpleValueChanged(123, undefined)).toBe(false);
  });

  it('should return false when both value1 and value2 are undefined', () => {
    expect(isSimpleValueChanged(undefined, undefined)).toBe(false);
  });
});

describe('Activity audit :: isPathKey', () => {
  it('should return true when key starts with "dial:"', () => {
    expect(isPathKey('dial:123')).toBe(true);
  });

  it('should return true when key is exactly "dial:"', () => {
    expect(isPathKey('dial:')).toBe(true);
  });

  it('should return false when key does not start with "dial:"', () => {
    expect(isPathKey('phone:123')).toBe(false);
  });

  it('should return false when key is an empty string', () => {
    expect(isPathKey('')).toBe(false);
  });

  it('should return false when key starts with "Dial:" (case-sensitive)', () => {
    expect(isPathKey('Dial:123')).toBe(false);
  });

  it('should return false when key contains "dial:" but not at the start', () => {
    expect(isPathKey('mydial:123')).toBe(false);
  });
});
