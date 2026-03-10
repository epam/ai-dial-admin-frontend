import { describe, test, expect } from 'vitest';
import { convertSchemaToTable, getSchemaDefaults, resolveRef } from '../schema';
import { JSONSchema7 } from 'json-schema';

describe('convertSchemaToTable', () => {
  test('returns empty array when no schema provided', () => {
    // @ts-ignore
    expect(convertSchemaToTable()).toEqual([]);
  });

  test('returns empty array when properties missing', () => {
    const schema: any = { title: 'Empty' };
    expect(convertSchemaToTable(schema)).toEqual([]);
  });

  test('converts schema properties to table rows with required flags', () => {
    const schema: any = {
      properties: {
        fieldA: { description: 'Description A', type: 'string' },
        fieldB: { description: 'Description B', type: 'number' },
      },
      required: ['fieldA'],
    };

    const result = convertSchemaToTable(schema);

    expect(result).toEqual([
      { field: 'fieldA', description: 'Description A', type: 'string', required: true },
      { field: 'fieldB', description: 'Description B', type: 'number', required: false },
    ]);
  });
});

describe('resolveRef', () => {
  test('should resolve #/definitions/Name', () => {
    const root: JSONSchema7 = {
      type: 'object',
      definitions: {
        Person: { type: 'object', properties: { name: { type: 'string' } } },
      },
    };
    const resolved = resolveRef(root, '#/definitions/Person');
    expect(resolved).toEqual({ type: 'object', properties: { name: { type: 'string' } } });
  });

  test('should resolve #/$defs/Name', () => {
    const root: JSONSchema7 = {
      type: 'object',
      $defs: {
        Id: { type: 'string' },
      },
    };
    const resolved = resolveRef(root, '#/$defs/Id');
    expect(resolved).toEqual({ type: 'string' });
  });

  test('should return undefined for invalid ref', () => {
    const root: JSONSchema7 = { type: 'object' };
    expect(resolveRef(root, '#/definitions/Missing')).toBeUndefined();
    expect(resolveRef(root, 'http://other.com/schema')).toBeUndefined();
  });
});

describe('getSchemaDefaults', () => {
  test('should return empty object for non-object schema', () => {
    expect(getSchemaDefaults({ type: 'string' })).toEqual({});
    expect(getSchemaDefaults({ type: 'array' })).toEqual({});
  });

  test('should use property defaults when present', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        name: { type: 'string', default: 'Alice' },
        count: { type: 'integer', default: 10 },
      },
    };
    expect(getSchemaDefaults(schema)).toEqual({ name: 'Alice', count: 10 });
  });

  test('should fill empty values by type when no default', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        s: { type: 'string' },
        n: { type: 'number' },
        i: { type: 'integer' },
        b: { type: 'boolean' },
        a: { type: 'array' },
        o: { type: 'object' },
        x: { type: 'null' },
      },
    };
    expect(getSchemaDefaults(schema)).toEqual({
      s: '',
      n: 0,
      i: 0,
      b: false,
      a: [],
      o: {},
      x: null,
    });
  });

  test('should resolve $ref and fill defaults', () => {
    const root: JSONSchema7 = {
      type: 'object',
      properties: {
        user: { $ref: '#/definitions/User' },
      },
      definitions: {
        User: {
          type: 'object',
          properties: {
            login: { type: 'string', default: 'guest' },
            role: { type: 'string' },
          },
        },
      },
    };
    expect(getSchemaDefaults(root.properties!.user as JSONSchema7, root)).toEqual({
      login: 'guest',
      role: '',
    });
    expect(getSchemaDefaults(root)).toEqual({
      user: { login: 'guest', role: '' },
    });
  });

  test('should recursively fill nested object properties', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: {
            city: { type: 'string' },
            zip: { type: 'integer', default: 0 },
          },
        },
      },
    };
    expect(getSchemaDefaults(schema)).toEqual({
      address: { city: '', zip: 0 },
    });
  });

  test('should use preferNonNull for anyOf/oneOf (e.g. string | null) by default', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        name: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        id: { oneOf: [{ type: 'integer' }, { type: 'null' }] },
      },
    };
    expect(getSchemaDefaults(schema)).toEqual({ name: '', id: 0 });
  });

  test('should use variantChoice index to select anyOf/oneOf branch (e.g. null)', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        name: { anyOf: [{ type: 'string' }, { type: 'null' }] },
        id: { oneOf: [{ type: 'integer' }, { type: 'null' }] },
      },
    };
    expect(getSchemaDefaults(schema, undefined, { variantChoice: 1 })).toEqual({ name: null, id: null });
  });

  test('should use variantChoice index 0 to select first branch explicitly', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        name: { anyOf: [{ type: 'null' }, { type: 'string' }] },
      },
    };
    expect(getSchemaDefaults(schema, undefined, { variantChoice: 0 })).toEqual({ name: null });
    expect(getSchemaDefaults(schema, undefined, { variantChoice: 1 })).toEqual({ name: '' });
  });
});
