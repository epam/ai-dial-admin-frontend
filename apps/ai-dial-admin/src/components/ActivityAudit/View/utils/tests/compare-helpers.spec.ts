import { ModelViewI18nKey } from '@/src/constants/i18n';
import { UNLIMITED_ACCEPTED_USERS, NO_LIMITS_KEY, UNLIMITED_VALUE, UNLIMITED_KEY } from '@/src/constants/role';
import { PricingType } from '@/src/models/dial/model';
import { ActivityAuditResourceType, DiffStatus } from '@/src/types/activity-audit';
import { describe, expect, test } from 'vitest';
import {
  convertPricing,
  convertRoleLimitsIntoString,
  convertShareValue,
  createEmptyObjectWithKeys,
  fillShareValues,
  generateStringFromObject,
  getShareStatus,
  isAppRunnerParameter,
  isPathKey,
  isSimpleValueAddedOrRemoved,
  isSimpleValueChanged,
  sortKeys,
} from '../compare-helpers';

describe('Activity audit :: generateStringFromObject', () => {
  const t = (key: string) => key;

  test('should return empty string when value is undefined', () => {
    expect(generateStringFromObject(undefined)).toBe('');
  });

  test('should return empty string when value is null', () => {
    expect(generateStringFromObject(null as any)).toBe('');
  });

  test('should return a formatted string when value is a plain object and no translator is passed', () => {
    const obj = { name: 'John', age: 30 };
    const result = generateStringFromObject(obj);
    expect(result).toBe('name: John, age: 30');
  });

  test('should return a string with all key-value pairs for mixed types', () => {
    const obj = { a: 1, b: true, c: 'x' };
    const result = generateStringFromObject(obj);
    expect(result).toBe('a: 1, b: true, c: x');
  });

  test('should use convertPricing when translator is provided', () => {
    const pricing = {
      unit: PricingType.Token,
      input: 0.002,
      output: 0.003,
    };

    const result = generateStringFromObject(pricing, t);

    expect(result).toBe('ModelView.Pricing.Tokens ModelView.Pricing.PerMillion, input: 2000, output: 3000');
  });

  test('should correctly handle character-based pricing when translator is provided', () => {
    const pricing = {
      unit: PricingType.Character,
      rate: 0.001,
    };

    const result = generateStringFromObject(pricing, t);
    expect(result).toBe('ModelView.Pricing.CharWithoutWhitespace, rate: 0.001');
  });

  test('should return an empty string for empty object input', () => {
    expect(generateStringFromObject({})).toBe('');
  });
});

describe('Activity audit :: convertPricing', () => {
  const t = (key: string) => key;

  test('should return empty string when value is undefined', () => {
    expect(convertPricing(undefined, t)).toBe('');
  });

  test('should format token-based pricing correctly (unit = Token)', () => {
    const pricing = {
      unit: PricingType.Token,
      input: 0.002,
      output: 0.003,
    };

    const result = convertPricing(pricing, t);
    expect(result).toBe(`${ModelViewI18nKey.Tokens} ${ModelViewI18nKey.PerMillion}, input: 2000, output: 3000`);
  });

  test('should format character-based pricing correctly (unit = Character)', () => {
    const pricing = {
      unit: PricingType.Character,
      input: 0.002,
      output: 0.003,
    };

    const result = convertPricing(pricing, t);
    expect(result).toBe(`${ModelViewI18nKey.CharWithoutWhitespace}, input: 0.002, output: 0.003`);
  });

  test('should multiply numeric values by 1,000,000 only when unit is Token', () => {
    const tokenPricing = { unit: PricingType.Token, rate: 0.001 };
    const charPricing = { unit: PricingType.Character, rate: 0.001 };

    const tokenResult = convertPricing(tokenPricing, t);
    const charResult = convertPricing(charPricing, t);

    expect(tokenResult).toContain('rate: 1000');
    expect(charResult).toContain('rate: 0.001');
  });

  test('should include all keys and join them with commas', () => {
    const pricing = {
      unit: PricingType.Token,
      a: 1,
      b: 2,
      c: 3,
    };

    const result = convertPricing(pricing, t);
    expect(result).toBe(
      `${ModelViewI18nKey.Tokens} ${ModelViewI18nKey.PerMillion}, a: 1000000, b: 2000000, c: 3000000`,
    );
  });

  test('should scale cacheRead and cacheWrite like the other token rates', () => {
    const pricing = {
      unit: PricingType.Token,
      prompt: 0.001,
      cacheRead: 0.002,
      cacheWrite: 0.003,
    };

    const result = convertPricing(pricing, t);
    expect(result).toBe(
      `${ModelViewI18nKey.Tokens} ${ModelViewI18nKey.PerMillion}, prompt: 1000, cacheRead: 2000, cacheWrite: 3000`,
    );
  });

  test('should handle string values gracefully in non-token mode', () => {
    const pricing = {
      unit: PricingType.Character,
      currency: 'USD',
    };

    const result = convertPricing(pricing, t);
    expect(result).toBe(`${ModelViewI18nKey.CharWithoutWhitespace}, currency: USD`);
  });
});

describe('Activity audit :: convertRoleLimitsIntoString', () => {
  test('should return empty string when limits is undefined', () => {
    expect(convertRoleLimitsIntoString(undefined)).toBe('');
  });

  test('should return empty string when limits is null', () => {
    expect(convertRoleLimitsIntoString(null as any)).toBe('');
  });

  test('should convert simple key-value pairs into a comma-separated string', () => {
    const limits = { maxUsers: 10, active: true };
    const result = convertRoleLimitsIntoString(limits);
    expect(result).toBe('maxUsers: 10, active: true');
  });

  test('should handle string values correctly', () => {
    const limits = { type: 'admin', level: 'high' };
    const result = convertRoleLimitsIntoString(limits);
    expect(result).toBe('type: admin, level: high');
  });

  test('should handle numeric, boolean, null, and undefined values gracefully', () => {
    const limits = {
      limit: 5,
      enabled: false,
      note: null,
      description: undefined,
    };
    const result = convertRoleLimitsIntoString(limits);
    expect(result).toBe('limit: 5, enabled: false, note: null, description: undefined');
  });

  test('should handle empty object correctly', () => {
    expect(convertRoleLimitsIntoString({})).toBe('');
  });

  test('should preserve the key order of the original object', () => {
    const limits = { a: 1, b: 2, c: 3 };
    const result = convertRoleLimitsIntoString(limits);
    expect(result).toBe('a: 1, b: 2, c: 3');
  });
});

describe('Activity audit :: fillShareValues', () => {
  test('should push a diff with converted value and CHANGED status when v1 and v2 differ', () => {
    const diffs: any[] = [];
    const v1 = { limit: '100' };
    const v2 = { limit: '200' };

    fillShareValues(diffs, 'limit', 'limit', v1, v2, false);

    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toEqual({
      parameter: 'limit.limit',
      value: '200',
      diffStatus: DiffStatus.CHANGED,
    });
  });

  test('should push a diff with NO_LIMITS_KEY when both values are falsy', () => {
    const diffs: any[] = [];
    const v1 = { rate: '' };
    const v2 = { rate: null };

    fillShareValues(diffs, 'rate', 'rate', v1, v2, false);

    expect(diffs).toHaveLength(1);
    expect(diffs[0].value).toBe(NO_LIMITS_KEY);
    expect(diffs[0].diffStatus).toBeUndefined();
  });

  test('should use val1 when v1 exists and v2 is missing', () => {
    const diffs: any[] = [];
    const v1 = { name: 'John' };

    fillShareValues(diffs, 'name', 'name', v1, undefined, false);

    expect(diffs).toHaveLength(1);
    expect(diffs[0]).toEqual({
      parameter: 'name.name',
      value: 'John',
      diffStatus: undefined,
    });
  });

  test('should convert milliseconds to hours when key is "invitationTtl"', () => {
    const diffs: any[] = [];
    const v2 = { invitationTtl: (2 * 60 * 60 * 1000).toString() }; // 2h in ms

    fillShareValues(diffs, 'invitationTtl', 'invitationTtl', undefined, v2, false);

    expect(diffs[0]).toEqual({
      parameter: 'invitationTtl.invitationTtl',
      value: '2',
      diffStatus: DiffStatus.ADDED,
    });
  });

  test('should set status to ADDED when v1 is missing and v2 is present, isCurrent = false', () => {
    const diffs: any[] = [];
    const v2 = { limit: '500' };

    fillShareValues(diffs, 'limit', 'limit', undefined, v2, false);

    expect(diffs[0]).toEqual({
      parameter: 'limit.limit',
      value: '500',
      diffStatus: DiffStatus.ADDED,
    });
  });

  test('should set status to MIRROR when v1 is missing and v2 is present, isCurrent = true', () => {
    const diffs: any[] = [];
    const v2 = { rate: '999' };

    fillShareValues(diffs, 'rate', 'rate', undefined, v2, true);

    expect(diffs[0]).toEqual({
      parameter: 'rate.rate',
      value: '999',
      diffStatus: DiffStatus.MIRROR,
    });
  });

  test('should set status to undefined when both values are equal', () => {
    const diffs: any[] = [];
    const v1 = { quota: '1000' };
    const v2 = { quota: '1000' };

    fillShareValues(diffs, 'quota', 'quota', v1, v2, false);

    expect(diffs[0].diffStatus).toBeUndefined();
  });

  test('should handle UNLIMITED_VALUE correctly and convert it to NO_LIMITS_KEY', () => {
    const diffs: any[] = [];
    const v2 = { limit: NO_LIMITS_KEY };

    fillShareValues(diffs, 'limit', 'limit', undefined, v2, false);

    expect(diffs[0].value).toBe(NO_LIMITS_KEY);
  });

  test('should use correct key when calling convertShareValue', () => {
    const diffs: any[] = [];
    const v1 = { maxAcceptedUsers: '10' };
    const v2 = { maxAcceptedUsers: '20' };

    fillShareValues(diffs, 'application', 'maxAcceptedUsers', v1, v2, false);

    expect(diffs[0].parameter).toBe('application.maxAcceptedUsers');
    expect(diffs[0].value).toBe('20'); // assuming '20' would be the returned value
    expect(diffs[0].diffStatus).toBe(DiffStatus.CHANGED);
  });
});

describe('Activity audit :: getShareStatus', () => {
  test('should return CHANGED when both values exist and are different', () => {
    expect(getShareStatus('old', 'new')).toBe(DiffStatus.CHANGED);
  });

  test('should return undefined when both values exist and are the same', () => {
    expect(getShareStatus('same', 'same')).toBeUndefined();
  });

  test('should return ADDED when v1 is falsy and v2 is truthy, and isCurrent is false', () => {
    expect(getShareStatus(null, 'value', false)).toBe(DiffStatus.ADDED);
    expect(getShareStatus(undefined, 'value', false)).toBe(DiffStatus.ADDED);
    expect(getShareStatus('', 'value', false)).toBe(DiffStatus.ADDED);
  });

  test('should return MIRROR when v1 is falsy and v2 is truthy, and isCurrent is true', () => {
    expect(getShareStatus(null, 'value', true)).toBe(DiffStatus.MIRROR);
  });

  test('should return undefined when both v1 and v2 are falsy', () => {
    expect(getShareStatus(null, null)).toBeUndefined();
    expect(getShareStatus(undefined, undefined)).toBeUndefined();
    expect(getShareStatus('', '')).toBeUndefined();
  });

  test('should return undefined when v1 is truthy and v2 is falsy (no change)', () => {
    expect(getShareStatus('value', null)).toBeUndefined();
    expect(getShareStatus('value', undefined)).toBeUndefined();
  });

  test('should prioritize comparison logic when both v1 and v2 exist, even if isCurrent is true', () => {
    expect(getShareStatus('x', 'y', true)).toBe(DiffStatus.CHANGED);
  });
});

describe('Activity audit :: convertShareValue', () => {
  test('should return NO_LIMITS_KEY when value is undefined', () => {
    expect(convertShareValue(undefined, 'invitationTtl', 'anyKey')).toBe(NO_LIMITS_KEY);
  });

  test('should return NO_LIMITS_KEY when value is null', () => {
    expect(convertShareValue(null, 'invitationTtl', 'anyKey')).toBe(NO_LIMITS_KEY);
  });

  test('should return NO_LIMITS_KEY when value equals UNLIMITED_VALUE', () => {
    expect(convertShareValue(UNLIMITED_VALUE, 'invitationTtl', 'anyKey')).toBe(UNLIMITED_KEY);
  });

  test('should return NO_LIMITS_KEY when value equals UNLIMITED_ACCEPTED_USERS', () => {
    expect(convertShareValue(UNLIMITED_ACCEPTED_USERS, 'invitationTtl', 'anyKey')).toBe(UNLIMITED_KEY);
  });

  test('should return default value from sharingDefaults when value is falsy and key is provided', () => {
    expect(convertShareValue(undefined, 'invitationTtl', 'application')).toBe('72');
    expect(convertShareValue(null, 'maxAcceptedUsers', 'application')).toBe('10');
  });

  test('should convert milliseconds to hours when field is "invitationTtl"', () => {
    const msValue = (2 * 60 * 60 * 1000).toString();
    const result = convertShareValue(msValue, 'invitationTtl', 'anyKey');
    expect(result).toBe('2');
  });

  test('should handle fractional hour conversion correctly for "invitationTtl"', () => {
    const msValue = (1.5 * 60 * 60 * 1000).toString();
    const result = convertShareValue(msValue, 'invitationTtl', 'anyKey');
    expect(result).toBe('1.5');
  });

  test('should return the value unchanged when field is not "invitationTtl"', () => {
    const result = convertShareValue('customValue', 'anyOtherField', 'anyKey');
    expect(result).toBe('customValue');
  });

  test('should treat an empty string as NO_LIMITS_KEY', () => {
    expect(convertShareValue('', 'invitationTtl', 'anyKey')).toBe(NO_LIMITS_KEY);
  });

  test('should return default value from sharingDefaults when value is empty string', () => {
    expect(convertShareValue('', 'invitationTtl', 'application')).toBe('72');
  });

  test('should return NO_LIMITS_KEY when value is falsy and no sharingDefaults exists for that key', () => {
    expect(convertShareValue('', 'maxAcceptedUsers', 'someInvalidKey')).toBe(NO_LIMITS_KEY);
  });
});

describe('Activity audit :: createEmptyObjectWithKeys', () => {
  test('should return an object with same keys but empty string values', () => {
    const input = { name: 'John', age: 30, active: true };
    const result = createEmptyObjectWithKeys(input);

    expect(Object.keys(result)).toEqual(['name', 'age', 'active']);
    expect(result).toEqual({ name: '', age: '', active: '' });
  });

  test('should handle an empty object and return an empty object', () => {
    const input = {};
    const result = createEmptyObjectWithKeys(input);
    expect(result).toEqual({});
  });

  test('should not modify the original object', () => {
    const input = { a: 1, b: 2 };
    const copy = { ...input };
    createEmptyObjectWithKeys(input);
    expect(input).toEqual(copy);
  });

  test('should handle objects with nested structures (only top-level keys emptied)', () => {
    const input = { user: { name: 'John' }, meta: { id: 1 } };
    const result = createEmptyObjectWithKeys(input);

    expect(result).toEqual({ user: '', meta: '' });
  });

  test('should handle objects with numeric keys (converted to strings internally)', () => {
    const input = { 1: 'one', 2: 'two' };
    const result = createEmptyObjectWithKeys(input);

    expect(result).toEqual({ 1: '', 2: '' });
  });

  test('should maintain the same set of keys when used with type inference', () => {
    const input = { x: 10, y: 20 };
    const result = createEmptyObjectWithKeys(input);

    expect(result).toHaveProperty('x');
    expect(result).toHaveProperty('y');
  });
});

describe('Activity audit :: isSimpleValueAddedOrRemoved', () => {
  test('should return true when value1 is string and value2 is empty string', () => {
    expect(isSimpleValueAddedOrRemoved('hello', '')).toBe(true);
  });

  test('should return true when value1 is number and value2 is empty string', () => {
    expect(isSimpleValueAddedOrRemoved(42, '')).toBe(true);
  });

  test('should return true when value1 is boolean true and value2 is empty string', () => {
    expect(isSimpleValueAddedOrRemoved(true, '')).toBe(true);
  });

  test('should return false when value1 is empty string and value2 is empty string', () => {
    expect(isSimpleValueAddedOrRemoved('', '')).toBe(false);
  });

  test('should return false when value1 is undefined and value2 is empty string', () => {
    expect(isSimpleValueAddedOrRemoved(undefined, '')).toBe(false);
  });

  test('should return false when value1 and value2 are different non-empty strings', () => {
    expect(isSimpleValueAddedOrRemoved('hello', 'world')).toBe(false);
  });

  test('should return false when value1 and value2 are different numbers', () => {
    expect(isSimpleValueAddedOrRemoved(1, 2)).toBe(false);
  });

  test('should return false when value1 and value2 are different booleans', () => {
    expect(isSimpleValueAddedOrRemoved(true, false)).toBe(false);
  });

  test('should return false when value1 and value2 are equal non-empty strings', () => {
    expect(isSimpleValueAddedOrRemoved('test', 'test')).toBe(false);
  });

  test('should return false when value1 and value2 are equal numbers', () => {
    expect(isSimpleValueAddedOrRemoved(5, 5)).toBe(false);
  });

  test('should return false when value1 and value2 are equal booleans', () => {
    expect(isSimpleValueAddedOrRemoved(true, true)).toBe(false);
  });
});

describe('Activity audit :: isSimpleValueChanged', () => {
  test('should return true when value1 and value2 are different strings', () => {
    expect(isSimpleValueChanged('hello', 'world')).toBe(true);
  });

  test('should return true when value1 and value2 are different numbers', () => {
    expect(isSimpleValueChanged(1, 2)).toBe(true);
  });

  test('should return true when value1 and value2 are different booleans', () => {
    expect(isSimpleValueChanged(true, false)).toBe(true);
  });

  test('should return false when value1 and value2 are equal strings', () => {
    expect(isSimpleValueChanged('test', 'test')).toBe(false);
  });

  test('should return false when value1 and value2 are equal numbers', () => {
    expect(isSimpleValueChanged(5, 5)).toBe(false);
  });

  test('should return false when value1 and value2 are equal booleans', () => {
    expect(isSimpleValueChanged(false, false)).toBe(false);
  });

  test('should return false when value1 is undefined and value2 is defined', () => {
    expect(isSimpleValueChanged(undefined, 123)).toBe(false);
  });

  test('should return false when value1 is defined and value2 is undefined', () => {
    expect(isSimpleValueChanged(123, undefined)).toBe(false);
  });

  test('should return false when both value1 and value2 are undefined', () => {
    expect(isSimpleValueChanged(undefined, undefined)).toBe(false);
  });
});

describe('Activity audit :: isAppRunnerParameter', () => {
  test('should return true when type is APPLICATION_TYPE_SCHEMA and key is "properties"', () => {
    expect(isAppRunnerParameter('properties', ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA)).toBe(true);
  });

  test('should return true when type is APPLICATION_TYPE_SCHEMA and key is "$defs"', () => {
    expect(isAppRunnerParameter('$defs', ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA)).toBe(true);
  });

  test('should return false when type is APPLICATION_TYPE_SCHEMA but key is not in appRunnerParameterKeys', () => {
    expect(isAppRunnerParameter('unknownKey', ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA)).toBe(false);
  });

  test('should return false when type is not APPLICATION_TYPE_SCHEMA, even if key matches', () => {
    expect(isAppRunnerParameter('properties', ActivityAuditResourceType.APPLICATION)).toBe(false);
    expect(isAppRunnerParameter('$defs', ActivityAuditResourceType.MODEL)).toBe(false);
  });

  test('should return false when type is undefined', () => {
    expect(isAppRunnerParameter('properties')).toBe(false);
  });

  test('should return false when key is empty', () => {
    expect(isAppRunnerParameter('', ActivityAuditResourceType.APPLICATION_TYPE_SCHEMA)).toBe(false);
  });

  test('should return false when both key and type are undefined', () => {
    expect(isAppRunnerParameter(undefined as any, undefined as any)).toBe(false);
  });
});

describe('Activity audit :: isPathKey', () => {
  test('should return true when key starts with "dial:"', () => {
    expect(isPathKey('dial:123')).toBe(true);
  });

  test('should return true when key is exactly "dial:"', () => {
    expect(isPathKey('dial:')).toBe(true);
  });

  test('should return false when key does not start with "dial:"', () => {
    expect(isPathKey('phone:123')).toBe(false);
  });

  test('should return false when key is an empty string', () => {
    expect(isPathKey('')).toBe(false);
  });

  test('should return false when key starts with "Dial:" (case-sensitive)', () => {
    expect(isPathKey('Dial:123')).toBe(false);
  });

  test('should return false when key contains "dial:" but not at the start', () => {
    expect(isPathKey('mydial:123')).toBe(false);
  });
});

describe('Activity audit :: sortKeys', () => {
  test('should return 0 when both keys are the same priority key', () => {
    expect(sortKeys('displayName', 'displayName')).toBe(0);
  });

  test('should sort keys according to their priority order', () => {
    expect(sortKeys('displayName', 'name')).toBeLessThan(0);
    expect(sortKeys('version', 'displayVersion')).toBeLessThan(0);
    expect(sortKeys('source', 'endpoint')).toBeLessThan(0);
  });

  test('should return a negative number if first key has higher priority (lower index)', () => {
    expect(sortKeys('displayName', 'description')).toBeLessThan(0);
  });

  test('should return a positive number if first key has lower priority (higher index)', () => {
    expect(sortKeys('description', 'displayName')).toBeGreaterThan(0);
  });

  test('should place non-priority keys after all priority keys', () => {
    expect(sortKeys('customField', 'displayName')).toBeGreaterThan(0);
    expect(sortKeys('displayName', 'customField')).toBeLessThan(0);
  });

  test('should sort non-priority keys alphabetically when both are not in priority list', () => {
    expect(sortKeys('apple', 'banana')).toBeLessThan(0);
    expect(sortKeys('zebra', 'alpha')).toBeGreaterThan(0);
  });

  test('should return 0 when both non-priority keys are identical', () => {
    expect(sortKeys('custom', 'custom')).toBe(0);
  });

  test('should handle edge cases where one or both keys are empty strings', () => {
    expect(sortKeys('', 'displayName')).toBeGreaterThan(0);
    expect(sortKeys('displayName', '')).toBeLessThan(0);
    expect(sortKeys('', '')).toBe(0);
  });

  test('should handle when both keys are not in the priority list but start with same letter', () => {
    expect(sortKeys('appleA', 'appleB')).toBeLessThan(0);
  });
});
