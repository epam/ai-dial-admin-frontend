import { describe, expect, test } from 'vitest';

import {
  convertDefaultsToArray,
  convertDefaultsToRecord,
  getDefaultValueType,
  getDefaultValueByType,
  getValueByType,
} from '../utils';
import { DefaultItemType } from '../types';
import { BooleanType } from '@/src/types/boolean';

describe('Defaults :: utils :: convertDefaultsToArray', () => {
  test('should convert an empty object to an empty array', () => {
    const result = convertDefaultsToArray({});
    expect(result).toEqual([]);
  });

  test('should convert a record with string values to an array', () => {
    const defaults = {
      name: 'Alice',
      email: 'alice@example.com',
    };

    const result = convertDefaultsToArray(defaults);
    expect(result).toEqual([
      { key: 'name', value: 'Alice' },
      { key: 'email', value: 'alice@example.com' },
    ]);
  });

  test('should convert a record with number values to an array', () => {
    const defaults = {
      age: 30,
      salary: 50000,
    };

    const result = convertDefaultsToArray(defaults);
    expect(result).toEqual([
      { key: 'age', value: 30 },
      { key: 'salary', value: 50000 },
    ]);
  });

  test('should convert a record with boolean values to an array', () => {
    const defaults = {
      isActive: true,
      isVerified: false,
    };

    const result = convertDefaultsToArray(defaults);
    expect(result).toEqual([
      { key: 'isActive', value: true },
      { key: 'isVerified', value: false },
    ]);
  });

  test('should handle a mix of string, number, and boolean values', () => {
    const defaults = {
      username: 'john_doe',
      age: 25,
      isAdmin: true,
    };

    const result = convertDefaultsToArray(defaults);
    expect(result).toEqual([
      { key: 'username', value: 'john_doe' },
      { key: 'age', value: 25 },
      { key: 'isAdmin', value: true },
    ]);
  });
});

describe('Defaults :: utils :: convertDefaultsToRecord', () => {
  test('should convert an empty array to an empty object', () => {
    const result = convertDefaultsToRecord([]);
    expect(result).toEqual({});
  });

  test('should convert an array with string values to a record', () => {
    const defaults = [
      { key: 'name', value: 'Alice' },
      { key: 'email', value: 'alice@example.com' },
    ];

    const result = convertDefaultsToRecord(defaults);
    expect(result).toEqual({
      name: 'Alice',
      email: 'alice@example.com',
    });
  });

  test('should convert an array with number values to a record', () => {
    const defaults = [
      { key: 'age', value: 30 },
      { key: 'salary', value: 50000 },
    ];

    const result = convertDefaultsToRecord(defaults);
    expect(result).toEqual({
      age: 30,
      salary: 50000,
    });
  });

  test('should convert an array with boolean values to a record', () => {
    const defaults = [
      { key: 'isActive', value: true },
      { key: 'isVerified', value: false },
    ];

    const result = convertDefaultsToRecord(defaults);
    expect(result).toEqual({
      isActive: true,
      isVerified: false,
    });
  });

  test('should handle a mix of string, number, and boolean values', () => {
    const defaults = [
      { key: 'username', value: 'john_doe' },
      { key: 'age', value: 25 },
      { key: 'isAdmin', value: true },
    ];

    const result = convertDefaultsToRecord(defaults);
    expect(result).toEqual({
      username: 'john_doe',
      age: 25,
      isAdmin: true,
    });
  });

  test('should ignore duplicate keys and overwrite values', () => {
    const defaults = [
      { key: 'name', value: 'Alice' },
      { key: 'name', value: 'Bob' },
    ];

    const result = convertDefaultsToRecord(defaults);
    expect(result).toEqual({
      name: 'Bob',
    });
  });
});

describe('Defaults :: utils :: getDefaultValueType', () => {
  test('should return "string" when value is a string', () => {
    const result = getDefaultValueType('hello');
    expect(result).toBe('string');
  });

  test('should return "number" when value is a number', () => {
    const result = getDefaultValueType(42);
    expect(result).toBe('number');
  });

  test('should return "boolean" when value is a boolean', () => {
    const result = getDefaultValueType(true);
    expect(result).toBe('boolean');
  });

  test('should return null when value is undefined', () => {
    const result = getDefaultValueType(undefined);
    expect(result).toBeNull();
  });

  test('should return null when value is null', () => {
    const result = getDefaultValueType(null);
    expect(result).toBeNull();
  });

  test('should return null when value is an object', () => {
    const result = getDefaultValueType({ key: 'value' });
    expect(result).toBeNull();
  });

  test('should return null when value is an array', () => {
    const result = getDefaultValueType([1, 2, 3]);
    expect(result).toBeNull();
  });

  test('should return null when value is a function', () => {
    const result = getDefaultValueType(() => {});
    expect(result).toBeNull();
  });
});

describe('Defaults :: utils :: getDefaultValueByType', () => {
  test('should return true when type is boolean', () => {
    const result = getDefaultValueByType(DefaultItemType.boolean);
    expect(result).toBe(true);
  });

  test('should return 0 when type is number', () => {
    const result = getDefaultValueByType(DefaultItemType.number);
    expect(result).toBe(0);
  });

  test('should return an empty string when type is string', () => {
    const result = getDefaultValueByType(DefaultItemType.string);
    expect(result).toBe('');
  });

  test('should return an empty string when type is invalid', () => {
    const result = getDefaultValueByType('invalid' as DefaultItemType);
    expect(result).toBe('');
  });
});

describe('Defaults :: utils :: getValueByType', () => {
  test('should return true for value "true" when type is boolean', () => {
    const result = getValueByType(BooleanType.true, DefaultItemType.boolean);
    expect(result).toBe(true);
  });

  test('should return true for any truthy value when type is boolean', () => {
    const result = getValueByType(1, DefaultItemType.boolean);
    expect(result).toBe(true);
  });

  test('should return false for falsy values when type is boolean', () => {
    const result = getValueByType(0, DefaultItemType.boolean);
    expect(result).toBe(false);
  });

  test('should return 0 when value is falsy and type is number', () => {
    const result = getValueByType('', DefaultItemType.number);
    expect(result).toBe(0);
  });

  test('should return correct number for number type', () => {
    const result = getValueByType('42', DefaultItemType.number);
    expect(result).toBe(42);
  });

  test('should return NaN for non-numeric values when type is number', () => {
    const result = getValueByType('hello', DefaultItemType.number);
    expect(result).toBeNaN();
  });

  test('should return empty string for value undefined when type is string', () => {
    const result = getValueByType(undefined, DefaultItemType.string);
    expect(result).toBe('undefined');
  });

  test('should return string value when type is string', () => {
    const result = getValueByType(42, DefaultItemType.string);
    expect(result).toBe('42');
  });

  test('should return string value for null or undefined if no type is passed', () => {
    const result = getValueByType(undefined);
    expect(result).toBe('undefined');
  });

  test('should return string value for any non-matching type', () => {
    const result = getValueByType(true, 'invalid-type' as DefaultItemType);
    expect(result).toBe('true');
  });
});
