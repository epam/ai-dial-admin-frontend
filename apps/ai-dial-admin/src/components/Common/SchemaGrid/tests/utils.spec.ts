import { describe, test, expect } from 'vitest';
import { JSONSchema7, JSONSchema7Definition } from 'json-schema';

import {
  getSchemaTypes,
  generateFieldId,
  createEmptyField,
  getGridSchemaPart,
  resolveDef,
  isNullOnly,
  getEffectiveSchema,
  jsonSchemaToFields,
  fieldsToJsonSchema,
  flattenFields,
  schemaToTreeNodes,
  SchemaFieldRow,
} from '../utils';

describe('getSchemaTypes', () => {
  test('should return all JSON Schema 7 types', () => {
    const types = getSchemaTypes();
    expect(types).toEqual(['string', 'number', 'integer', 'boolean', 'object', 'array', 'null']);
  });
});

describe('generateFieldId', () => {
  test('should return a string starting with "schema-field-"', () => {
    const id = generateFieldId();
    expect(id).toMatch(/^schema-field-\d+$/);
  });

  test('should return incrementing unique IDs on each call', () => {
    const id1 = generateFieldId();
    const id2 = generateFieldId();
    expect(id1).not.toBe(id2);
  });
});

describe('createEmptyField', () => {
  test('should create a field with default values', () => {
    const field = createEmptyField();
    expect(field).toMatchObject({
      name: '',
      type: 'string',
      required: false,
      description: '',
      expanded: false,
      children: [],
      parentId: null,
      depth: 0,
    });
    expect(field.id).toMatch(/^schema-field-\d+$/);
  });

  test('should accept parentId and depth params', () => {
    const field = createEmptyField('parent-1', 2);
    expect(field.parentId).toBe('parent-1');
    expect(field.depth).toBe(2);
  });
});

describe('getGridSchemaPart', () => {
  test('should return undefined for undefined schema', () => {
    expect(getGridSchemaPart(undefined)).toBeUndefined();
  });

  test('should return only type, properties, and required', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: { a: { type: 'string' } },
      required: ['a'],
      $defs: { X: { type: 'string' } },
      description: 'ignored',
    };
    const part = getGridSchemaPart(schema);
    expect(part).toEqual({ type: 'object', properties: schema.properties, required: ['a'] });
    expect(part).not.toHaveProperty('$defs');
    expect(part).not.toHaveProperty('description');
  });

  test('should handle schema without required', () => {
    const schema: JSONSchema7 = { type: 'object', properties: {} };
    expect(getGridSchemaPart(schema)).toEqual({ type: 'object', properties: {}, required: undefined });
  });
});

describe('resolveDef', () => {
  test('should return def unchanged when def has no $ref', () => {
    const def: JSONSchema7 = { type: 'string' };
    const root: JSONSchema7 = { type: 'object' };
    expect(resolveDef(def, root)).toBe(def);
  });

  test('should resolve $ref against root definitions', () => {
    const root: JSONSchema7 = {
      type: 'object',
      definitions: { Foo: { type: 'boolean' } },
    };
    const def = { $ref: '#/definitions/Foo' };
    expect(resolveDef(def, root)).toEqual({ type: 'boolean' });
  });

  test('should resolve $ref against root $defs', () => {
    const root: JSONSchema7 = {
      type: 'object',
      $defs: { Bar: { type: 'integer' } },
    };
    const def = { $ref: '#/$defs/Bar' };
    expect(resolveDef(def, root)).toEqual({ type: 'integer' });
  });

  test('should return def when $ref cannot be resolved', () => {
    const root: JSONSchema7 = { type: 'object' };
    const def = { $ref: '#/definitions/Missing' };
    expect(resolveDef(def, root)).toBe(def);
  });
});

describe('isNullOnly', () => {
  test('should return true for type "null"', () => {
    expect(isNullOnly({ type: 'null' } as JSONSchema7)).toBe(true);
  });

  test('should return true for type ["null"]', () => {
    expect(isNullOnly({ type: ['null'] } as JSONSchema7)).toBe(true);
  });

  test('should return false for type "string"', () => {
    expect(isNullOnly({ type: 'string' } as JSONSchema7)).toBe(false);
  });

  test('should return false for type ["string", "null"]', () => {
    expect(isNullOnly({ type: ['string', 'null'] } as JSONSchema7)).toBe(false);
  });

  test('should return false when type is undefined', () => {
    expect(isNullOnly({} as JSONSchema7)).toBe(false);
  });
});

describe('getEffectiveSchema', () => {
  test('should return null for non-object def', () => {
    const root: JSONSchema7 = { type: 'object' };
    expect(getEffectiveSchema(undefined as unknown as JSONSchema7Definition, root)).toBeNull();
    expect(getEffectiveSchema(true as unknown as JSONSchema7Definition, root)).toBeNull();
  });

  test('should return schema as-is when no anyOf/oneOf', () => {
    const root: JSONSchema7 = { type: 'object' };
    const def: JSONSchema7 = { type: 'boolean' };
    expect(getEffectiveSchema(def, root)).toEqual(def);
  });

  test('should resolve $ref first then return', () => {
    const root: JSONSchema7 = {
      type: 'object',
      $defs: { T: { type: 'number' } },
    };
    const def = { $ref: '#/$defs/T' };
    expect(getEffectiveSchema(def, root)).toEqual({ type: 'number' });
  });

  test('should pick first non-null variant from anyOf', () => {
    const root: JSONSchema7 = { type: 'object' };
    const def: JSONSchema7 = {
      anyOf: [{ type: 'null' }, { type: 'boolean' }, { type: 'string' }],
    };
    expect(getEffectiveSchema(def, root)).toEqual({ type: 'boolean' });
  });

  test('should pick first non-null variant from oneOf', () => {
    const root: JSONSchema7 = { type: 'object' };
    const def: JSONSchema7 = {
      oneOf: [{ type: 'null' }, { type: 'array', items: { type: 'string' } }],
    };
    const result = getEffectiveSchema(def, root);
    expect(result).toMatchObject({ type: 'array' });
    expect(result?.items).toEqual({ type: 'string' });
  });

  test('should return first variant when all are null', () => {
    const root: JSONSchema7 = { type: 'object' };
    const def: JSONSchema7 = {
      anyOf: [{ type: 'null' }],
    };
    expect(getEffectiveSchema(def, root)).toEqual({ type: 'null' });
  });
});

describe('jsonSchemaToFields', () => {
  test('should return empty array for undefined schema', () => {
    expect(jsonSchemaToFields(undefined)).toEqual([]);
  });

  test('should return empty array for non-object schema', () => {
    expect(jsonSchemaToFields({ type: 'string' })).toEqual([]);
  });

  test('should return empty array for object schema without properties', () => {
    expect(jsonSchemaToFields({ type: 'object' })).toEqual([]);
  });

  test('should convert flat object schema to fields', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The name' },
        age: { type: 'integer' },
      },
      required: ['name'],
    };

    const fields = jsonSchemaToFields(schema);

    expect(fields).toHaveLength(2);
    expect(fields[0]).toMatchObject({
      name: 'name',
      type: 'string',
      required: true,
      description: 'The name',
      depth: 0,
      parentId: null,
      children: [],
    });
    expect(fields[1]).toMatchObject({
      name: 'age',
      type: 'integer',
      required: false,
      description: '',
      depth: 0,
      parentId: null,
      children: [],
    });
  });

  test('should default type to string when not specified', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        untyped: {},
      },
    };

    const fields = jsonSchemaToFields(schema);
    expect(fields[0].type).toBe('string');
  });

  test('should handle nested object properties', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: {
            street: { type: 'string', description: 'Street name' },
            zip: { type: 'string' },
          },
          required: ['street'],
        },
      },
    };

    const fields = jsonSchemaToFields(schema);

    expect(fields).toHaveLength(1);
    expect(fields[0].type).toBe('object');
    expect(fields[0].expanded).toBe(true);
    expect(fields[0].children).toHaveLength(2);

    const street = fields[0].children[0];
    expect(street).toMatchObject({
      name: 'street',
      type: 'string',
      required: true,
      description: 'Street name',
      depth: 1,
      parentId: fields[0].id,
    });

    const zip = fields[0].children[1];
    expect(zip).toMatchObject({
      name: 'zip',
      type: 'string',
      required: false,
      depth: 1,
      parentId: fields[0].id,
    });
  });

  test('should handle array type with object items', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        tags: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              value: { type: 'string' },
            },
            required: ['key'],
          },
        },
      },
    };

    const fields = jsonSchemaToFields(schema);

    expect(fields).toHaveLength(1);
    expect(fields[0].type).toBe('array');
    expect(fields[0].expanded).toBe(true);
    expect(fields[0].children).toHaveLength(2);
    expect(fields[0].children[0]).toMatchObject({
      name: 'key',
      type: 'string',
      required: true,
      depth: 1,
      parentId: fields[0].id,
    });
    expect(fields[0].children[1]).toMatchObject({
      name: 'value',
      type: 'string',
      required: false,
      depth: 1,
      parentId: fields[0].id,
    });
  });

  test('should not expand object without nested properties', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        emptyObj: { type: 'object' },
      },
    };

    const fields = jsonSchemaToFields(schema);
    expect(fields[0].expanded).toBe(false);
    expect(fields[0].children).toEqual([]);
  });

  test('should not expand array without object items', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        simpleArray: { type: 'array', items: { type: 'string' } },
      },
    };

    const fields = jsonSchemaToFields(schema);
    expect(fields[0].expanded).toBe(false);
    expect(fields[0].children).toEqual([]);
  });

  test('should resolve $ref from $defs when building fields', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        user: { $ref: '#/$defs/User' },
        count: { type: 'integer' },
      },
      $defs: {
        User: {
          type: 'object',
          properties: {
            login: { type: 'string', description: 'Username' },
            role: { type: 'string' },
          },
          required: ['login'],
        },
      },
    };

    const fields = jsonSchemaToFields(schema, schema);

    expect(fields).toHaveLength(2);
    expect(fields[0]).toMatchObject({
      name: 'user',
      type: 'object',
      required: false,
      expanded: true,
    });
    expect(fields[0].children).toHaveLength(2);
    expect(fields[0].children[0]).toMatchObject({
      name: 'login',
      type: 'string',
      required: true,
      description: 'Username',
    });
    expect(fields[0].children[1]).toMatchObject({ name: 'role', type: 'string', required: false });
    expect(fields[1]).toMatchObject({ name: 'count', type: 'integer' });
  });

  test('should resolve $ref from definitions when building fields', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        address: { $ref: '#/definitions/Address' },
      },
      definitions: {
        Address: {
          type: 'object',
          properties: {
            city: { type: 'string' },
            zip: { type: 'integer' },
          },
        },
      },
    };

    const fields = jsonSchemaToFields(schema, schema);

    expect(fields).toHaveLength(1);
    expect(fields[0]).toMatchObject({ name: 'address', type: 'object' });
    expect(fields[0].children).toHaveLength(2);
    expect(fields[0].children[0]).toMatchObject({ name: 'city', type: 'string' });
    expect(fields[0].children[1]).toMatchObject({ name: 'zip', type: 'integer' });
  });

  test('should preserve dial:meta value as dialMeta on first-level properties only', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        orchestrator: {
          type: 'object' as const,
          properties: {
            deployment: { $ref: '#/$defs/DialDeploymentConfig', description: 'Deployment config' },
            name: { type: 'string' as const },
          },
          required: ['deployment'],
          title: 'OrchestratorConfig',
          description: 'Orchestrator config',
          'dial:meta': {
            'dial:propertyKind': 'server',
            'dial:propertyOrder': 1,
          },
        },
        plain: { type: 'string' as const },
      },
    };

    const fields = jsonSchemaToFields(schema as JSONSchema7, schema as JSONSchema7);

    expect(fields).toHaveLength(2);
    expect(fields[0].name).toBe('orchestrator');
    expect(fields[0].dialMeta).toEqual({ 'dial:propertyKind': 'server', 'dial:propertyOrder': 1 });
    expect(fields[0].children).toHaveLength(2);
    expect(fields[0].children[0].dialMeta).toBeUndefined();
    expect(fields[0].children[1].dialMeta).toBeUndefined();
    expect(fields[1].name).toBe('plain');
    expect(fields[1].dialMeta).toBeUndefined();
  });

  test('should derive boolean/array/object from anyOf/oneOf instead of defaulting to string', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        flag: { anyOf: [{ type: 'boolean' }, { type: 'null' }] },
        tags: { oneOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }] },
        count: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
        nested: {
          oneOf: [{ type: 'object', properties: { x: { type: 'string' } } }, { type: 'null' }],
        },
      },
    };

    const fields = jsonSchemaToFields(schema);

    expect(fields).toHaveLength(4);
    expect(fields[0]).toMatchObject({ name: 'flag', type: 'boolean' });
    expect(fields[1]).toMatchObject({ name: 'tags', type: 'array' });
    expect(fields[2]).toMatchObject({ name: 'count', type: 'integer' });
    expect(fields[3]).toMatchObject({ name: 'nested', type: 'object' });
    expect(fields[3].children).toHaveLength(1);
    expect(fields[3].children[0]).toMatchObject({ name: 'x', type: 'string' });
  });

  test('should handle boolean schema definitions gracefully', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        boolDef: true as unknown as JSONSchema7,
      },
    };

    const fields = jsonSchemaToFields(schema);
    expect(fields).toHaveLength(1);
    expect(fields[0]).toMatchObject({ name: 'boolDef', type: 'string' });
  });

  test('should handle boolean child schema definitions', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        parent: {
          type: 'object',
          properties: {
            boolChild: true as unknown as JSONSchema7,
          },
        },
      },
    };

    const fields = jsonSchemaToFields(schema);
    expect(fields[0].children).toHaveLength(1);
    expect(fields[0].children[0]).toMatchObject({ name: 'boolChild' });
  });

  test('should handle boolean child schema in array items', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              boolChild: true as unknown as JSONSchema7,
            },
          },
        },
      },
    };

    const fields = jsonSchemaToFields(schema);
    expect(fields[0].children).toHaveLength(1);
    expect(fields[0].children[0]).toMatchObject({ name: 'boolChild' });
  });
});

describe('fieldsToJsonSchema', () => {
  test('should convert empty fields to empty object schema', () => {
    const schema = fieldsToJsonSchema([]);
    expect(schema).toEqual({ type: 'object', properties: {} });
  });

  test('should preserve dialMeta as dial:meta on first-level properties', () => {
    const fields: SchemaFieldRow[] = [
      {
        id: 'f1',
        name: 'orchestrator',
        type: 'object',
        required: false,
        description: 'Orchestrator config',
        expanded: false,
        children: [],
        parentId: null,
        depth: 0,
        dialMeta: { 'dial:propertyKind': 'server', 'dial:propertyOrder': 1 },
      },
    ];
    const schema = fieldsToJsonSchema(fields);
    expect(schema.properties?.orchestrator).toMatchObject({
      type: 'object',
      description: 'Orchestrator config',
      'dial:meta': { 'dial:propertyKind': 'server', 'dial:propertyOrder': 1 },
    });
  });

  test('should convert flat fields to JSON Schema', () => {
    const fields: SchemaFieldRow[] = [
      {
        id: 'f1',
        name: 'username',
        type: 'string',
        required: true,
        description: 'User name',
        expanded: false,
        children: [],
        parentId: null,
        depth: 0,
      },
      {
        id: 'f2',
        name: 'active',
        type: 'boolean',
        required: false,
        description: '',
        expanded: false,
        children: [],
        parentId: null,
        depth: 0,
      },
    ];

    const schema = fieldsToJsonSchema(fields);

    expect(schema).toEqual({
      type: 'object',
      properties: {
        username: { type: 'string', description: 'User name' },
        active: { type: 'boolean' },
      },
      required: ['username'],
    });
  });

  test('should omit required array if no fields are required', () => {
    const fields: SchemaFieldRow[] = [
      {
        id: 'f1',
        name: 'optional',
        type: 'string',
        required: false,
        description: '',
        expanded: false,
        children: [],
        parentId: null,
        depth: 0,
      },
    ];

    const schema = fieldsToJsonSchema(fields);
    expect(schema.required).toBeUndefined();
  });

  test('should omit description when empty', () => {
    const fields: SchemaFieldRow[] = [
      {
        id: 'f1',
        name: 'field',
        type: 'string',
        required: false,
        description: '',
        expanded: false,
        children: [],
        parentId: null,
        depth: 0,
      },
    ];

    const schema = fieldsToJsonSchema(fields);
    expect(schema.properties!['field']).toEqual({ type: 'string' });
    expect(schema.properties!['field']).not.toHaveProperty('description');
  });

  test('should convert object field with children', () => {
    const fields: SchemaFieldRow[] = [
      {
        id: 'f1',
        name: 'address',
        type: 'object',
        required: false,
        description: '',
        expanded: true,
        children: [
          {
            id: 'c1',
            name: 'street',
            type: 'string',
            required: true,
            description: 'Street name',
            expanded: false,
            children: [],
            parentId: 'f1',
            depth: 1,
          },
          {
            id: 'c2',
            name: 'city',
            type: 'string',
            required: false,
            description: '',
            expanded: false,
            children: [],
            parentId: 'f1',
            depth: 1,
          },
        ],
        parentId: null,
        depth: 0,
      },
    ];

    const schema = fieldsToJsonSchema(fields);

    expect(schema.properties!['address']).toEqual({
      type: 'object',
      properties: {
        street: { type: 'string', description: 'Street name' },
        city: { type: 'string' },
      },
      required: ['street'],
    });
  });

  test('should convert array field with children as items', () => {
    const fields: SchemaFieldRow[] = [
      {
        id: 'f1',
        name: 'tags',
        type: 'array',
        required: true,
        description: '',
        expanded: true,
        children: [
          {
            id: 'c1',
            name: 'key',
            type: 'string',
            required: true,
            description: '',
            expanded: false,
            children: [],
            parentId: 'f1',
            depth: 1,
          },
          {
            id: 'c2',
            name: 'value',
            type: 'number',
            required: false,
            description: '',
            expanded: false,
            children: [],
            parentId: 'f1',
            depth: 1,
          },
        ],
        parentId: null,
        depth: 0,
      },
    ];

    const schema = fieldsToJsonSchema(fields);

    expect(schema.properties!['tags']).toEqual({
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          value: { type: 'number' },
        },
        required: ['key'],
      },
    });
    expect(schema.required).toEqual(['tags']);
  });

  test('should add empty properties {} for object without children', () => {
    const fields: SchemaFieldRow[] = [
      {
        id: 'f1',
        name: 'empty',
        type: 'object',
        required: false,
        description: '',
        expanded: false,
        children: [],
        parentId: null,
        depth: 0,
      },
    ];

    const schema = fieldsToJsonSchema(fields);
    expect(schema.properties!['empty']).toEqual({ type: 'object', properties: {} });
  });

  test('should add items with type string when array has no children', () => {
    const fields: SchemaFieldRow[] = [
      {
        id: 'f1',
        name: 'tags',
        type: 'array',
        required: false,
        description: '',
        expanded: false,
        children: [],
        parentId: null,
        depth: 0,
      },
    ];

    const schema = fieldsToJsonSchema(fields);
    expect(schema.properties!['tags']).toEqual({
      type: 'array',
      items: { type: 'string' },
    });
  });
});

describe('fieldsToJsonSchema and jsonSchemaToFields round-trip', () => {
  test('should round-trip a flat schema', () => {
    const original: JSONSchema7 = {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'A name' },
        count: { type: 'integer' },
      },
      required: ['name'],
    };

    const fields = jsonSchemaToFields(original);
    const result = fieldsToJsonSchema(fields);

    expect(result).toEqual(original);
  });

  test('should round-trip a nested object schema', () => {
    const original: JSONSchema7 = {
      type: 'object',
      properties: {
        config: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            timeout: { type: 'number', description: 'Timeout in ms' },
          },
          required: ['enabled'],
        },
      },
    };

    const fields = jsonSchemaToFields(original);
    const result = fieldsToJsonSchema(fields);

    expect(result).toEqual(original);
  });

  test('should round-trip an array with object items', () => {
    const original: JSONSchema7 = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              score: { type: 'number' },
            },
            required: ['id'],
          },
        },
      },
    };

    const fields = jsonSchemaToFields(original);
    const result = fieldsToJsonSchema(fields);

    expect(result).toEqual(original);
  });
});

describe('flattenFields', () => {
  test('should return only the add-root-field row for empty fields', () => {
    const result = flattenFields([]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'add-root-field',
      isAddSubFieldRow: true,
      depth: 0,
      parentId: null,
    });
  });

  test('should not add add-root-field or add-sub-field rows when isReadonly is true', () => {
    const resultEmpty = flattenFields([], 0, true);
    expect(resultEmpty).toHaveLength(0);
    expect(resultEmpty.some((r) => r.isAddSubFieldRow)).toBe(false);

    const fields: SchemaFieldRow[] = [
      {
        id: 'f1',
        name: 'obj',
        type: 'object',
        required: false,
        description: '',
        expanded: true,
        children: [
          {
            id: 'c1',
            name: 'x',
            type: 'string',
            required: false,
            description: '',
            expanded: false,
            children: [],
            parentId: 'f1',
            depth: 1,
          },
        ],
        parentId: null,
        depth: 0,
      },
    ];
    const result = flattenFields(fields, 0, true);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('obj');
    expect(result[1].name).toBe('x');
    expect(result.some((r) => r.isAddSubFieldRow)).toBe(false);
  });

  test('should flatten simple fields and append add-root-field row', () => {
    const fields: SchemaFieldRow[] = [
      {
        id: 'f1',
        name: 'name',
        type: 'string',
        required: false,
        description: '',
        expanded: false,
        children: [],
        parentId: null,
        depth: 0,
      },
      {
        id: 'f2',
        name: 'age',
        type: 'integer',
        required: false,
        description: '',
        expanded: false,
        children: [],
        parentId: null,
        depth: 0,
      },
    ];

    const result = flattenFields(fields);

    expect(result).toHaveLength(3);
    expect(result[0].name).toBe('name');
    expect(result[1].name).toBe('age');
    expect(result[2].id).toBe('add-root-field');
  });

  test('should flatten expanded object with children and add sub-field row', () => {
    const fields: SchemaFieldRow[] = [
      {
        id: 'f1',
        name: 'config',
        type: 'object',
        required: false,
        description: '',
        expanded: true,
        children: [
          {
            id: 'c1',
            name: 'key',
            type: 'string',
            required: false,
            description: '',
            expanded: false,
            children: [],
            parentId: 'f1',
            depth: 1,
          },
        ],
        parentId: null,
        depth: 0,
      },
    ];

    const result = flattenFields(fields);

    // f1, c1, add-sub-f1, add-root-field
    expect(result).toHaveLength(4);
    expect(result[0]).toMatchObject({ id: 'f1', depth: 0 });
    expect(result[1]).toMatchObject({ id: 'c1', depth: 1 });
    expect(result[2]).toMatchObject({
      id: 'add-sub-f1',
      isAddSubFieldRow: true,
      parentId: 'f1',
      depth: 1,
    });
    expect(result[3]).toMatchObject({ id: 'add-root-field', isAddSubFieldRow: true });
  });

  test('should flatten expanded array field the same as object', () => {
    const fields: SchemaFieldRow[] = [
      {
        id: 'f1',
        name: 'items',
        type: 'array',
        required: false,
        description: '',
        expanded: true,
        children: [
          {
            id: 'c1',
            name: 'id',
            type: 'string',
            required: false,
            description: '',
            expanded: false,
            children: [],
            parentId: 'f1',
            depth: 1,
          },
        ],
        parentId: null,
        depth: 0,
      },
    ];

    const result = flattenFields(fields);

    expect(result).toHaveLength(4);
    expect(result[0]).toMatchObject({ id: 'f1', depth: 0 });
    expect(result[1]).toMatchObject({ id: 'c1', depth: 1 });
    expect(result[2]).toMatchObject({ id: 'add-sub-f1', isAddSubFieldRow: true, depth: 1 });
    expect(result[3]).toMatchObject({ id: 'add-root-field' });
  });

  test('should not flatten children of collapsed object/array', () => {
    const fields: SchemaFieldRow[] = [
      {
        id: 'f1',
        name: 'config',
        type: 'object',
        required: false,
        description: '',
        expanded: false,
        children: [
          {
            id: 'c1',
            name: 'key',
            type: 'string',
            required: false,
            description: '',
            expanded: false,
            children: [],
            parentId: 'f1',
            depth: 1,
          },
        ],
        parentId: null,
        depth: 0,
      },
    ];

    const result = flattenFields(fields);

    // f1 (collapsed), add-root-field
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 'f1' });
    expect(result[1]).toMatchObject({ id: 'add-root-field' });
  });

  test('should not add sub-field row for non-object/array expanded types', () => {
    const fields: SchemaFieldRow[] = [
      {
        id: 'f1',
        name: 'title',
        type: 'string',
        required: false,
        description: '',
        expanded: true,
        children: [],
        parentId: null,
        depth: 0,
      },
    ];

    const result = flattenFields(fields);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: 'f1' });
    expect(result[1]).toMatchObject({ id: 'add-root-field' });
  });

  test('should add sub-field row even when expanded object has no children', () => {
    const fields: SchemaFieldRow[] = [
      {
        id: 'f1',
        name: 'empty',
        type: 'object',
        required: false,
        description: '',
        expanded: true,
        children: [],
        parentId: null,
        depth: 0,
      },
    ];

    const result = flattenFields(fields);

    // f1, add-sub-f1, add-root-field
    expect(result).toHaveLength(3);
    expect(result[1]).toMatchObject({
      id: 'add-sub-f1',
      isAddSubFieldRow: true,
      parentId: 'f1',
      depth: 1,
    });
  });

  test('should handle multiple fields at root with mixed types', () => {
    const fields: SchemaFieldRow[] = [
      {
        id: 'f1',
        name: 'simple',
        type: 'string',
        required: false,
        description: '',
        expanded: false,
        children: [],
        parentId: null,
        depth: 0,
      },
      {
        id: 'f2',
        name: 'nested',
        type: 'object',
        required: false,
        description: '',
        expanded: true,
        children: [
          {
            id: 'c1',
            name: 'a',
            type: 'string',
            required: false,
            description: '',
            expanded: false,
            children: [],
            parentId: 'f2',
            depth: 1,
          },
          {
            id: 'c2',
            name: 'b',
            type: 'number',
            required: false,
            description: '',
            expanded: false,
            children: [],
            parentId: 'f2',
            depth: 1,
          },
        ],
        parentId: null,
        depth: 0,
      },
      {
        id: 'f3',
        name: 'another',
        type: 'boolean',
        required: false,
        description: '',
        expanded: false,
        children: [],
        parentId: null,
        depth: 0,
      },
    ];

    const result = flattenFields(fields);

    // f1, f2, c1, c2, add-sub-f2, f3, add-root-field
    expect(result).toHaveLength(7);
    expect(result.map((r) => r.id)).toEqual(['f1', 'f2', 'c1', 'c2', 'add-sub-f2', 'f3', 'add-root-field']);
  });
});

describe('schemaToTreeNodes', () => {
  test('should return empty array for undefined schema', () => {
    expect(schemaToTreeNodes(undefined, '')).toEqual([]);
  });

  test('should return empty array for schema without properties', () => {
    expect(schemaToTreeNodes({ type: 'object' }, '')).toEqual([]);
    expect(schemaToTreeNodes({ type: 'string' } as JSONSchema7, '')).toEqual([]);
  });

  test('should resolve $ref from $defs when building tree nodes', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        profile: { $ref: '#/$defs/Profile' },
        id: { type: 'string' },
      },
      $defs: {
        Profile: {
          type: 'object',
          properties: {
            displayName: { type: 'string' },
            age: { type: 'integer' },
          },
        },
      },
    };

    const nodes = schemaToTreeNodes(schema, '', schema);

    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toMatchObject({
      path: 'profile',
      name: 'profile',
      type: 'object',
    });
    expect(nodes[0].children).toHaveLength(2);
    expect(nodes[0].children[0]).toMatchObject({
      path: 'profile.displayName',
      name: 'displayName',
      type: 'string',
      children: [],
    });
    expect(nodes[0].children[1]).toMatchObject({
      path: 'profile.age',
      name: 'age',
      type: 'integer',
      children: [],
    });
    expect(nodes[1]).toMatchObject({ path: 'id', name: 'id', type: 'string', children: [] });
  });

  test('should preserve dial:meta value as dialMeta on first-level tree nodes only', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        orchestrator: {
          type: 'object' as const,
          properties: { name: { type: 'string' as const } },
          'dial:meta': { 'dial:propertyKind': 'server', 'dial:propertyOrder': 1 },
        },
        leaf: { type: 'string' as const },
      },
    };

    const nodes = schemaToTreeNodes(schema as JSONSchema7, '', schema as JSONSchema7);

    expect(nodes).toHaveLength(2);
    expect(nodes[0].name).toBe('orchestrator');
    expect(nodes[0].dialMeta).toEqual({ 'dial:propertyKind': 'server', 'dial:propertyOrder': 1 });
    expect(nodes[0].children).toHaveLength(1);
    expect(nodes[0].children[0].dialMeta).toBeUndefined();
    expect(nodes[1].name).toBe('leaf');
    expect(nodes[1].dialMeta).toBeUndefined();
  });

  test('should derive types from anyOf/oneOf in tree nodes', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        enabled: { anyOf: [{ type: 'boolean' }, { type: 'null' }] },
        list: { oneOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }] },
      },
    };

    const nodes = schemaToTreeNodes(schema, '', schema);

    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toMatchObject({ path: 'enabled', name: 'enabled', type: 'boolean', children: [] });
    expect(nodes[1]).toMatchObject({ path: 'list', name: 'list', type: 'array' });
  });

  test('should convert flat object schema to tree nodes with empty parentPath', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        count: { type: 'integer' },
      },
    };

    const nodes = schemaToTreeNodes(schema, '');

    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toMatchObject({
      path: 'id',
      name: 'id',
      type: 'string',
      children: [],
    });
    expect(nodes[1]).toMatchObject({
      path: 'count',
      name: 'count',
      type: 'integer',
      children: [],
    });
  });

  test('should prefix paths with parentPath when parentPath is non-empty', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'number' },
      },
    };

    const nodes = schemaToTreeNodes(schema, 'root');

    expect(nodes).toHaveLength(2);
    expect(nodes[0]).toMatchObject({ path: 'root.foo', name: 'foo', type: 'string' });
    expect(nodes[1]).toMatchObject({ path: 'root.bar', name: 'bar', type: 'number' });
  });

  test('should default type to string when definition is not a full object', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        boolDef: true as unknown as JSONSchema7,
      },
    };

    const nodes = schemaToTreeNodes(schema, '');

    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      path: 'boolDef',
      name: 'boolDef',
      type: 'string',
      children: [],
    });
  });

  test('should handle nested object with recursive paths', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        address: {
          type: 'object',
          properties: {
            street: { type: 'string' },
            zip: { type: 'string' },
          },
        },
      },
    };

    const nodes = schemaToTreeNodes(schema, '');

    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      path: 'address',
      name: 'address',
      type: 'object',
    });
    expect(nodes[0].children).toHaveLength(2);
    expect(nodes[0].children[0]).toMatchObject({
      path: 'address.street',
      name: 'street',
      type: 'string',
      children: [],
    });
    expect(nodes[0].children[1]).toMatchObject({
      path: 'address.zip',
      name: 'zip',
      type: 'string',
      children: [],
    });
  });

  test('should handle object without nested properties as leaf', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        emptyObj: { type: 'object' },
      },
    };

    const nodes = schemaToTreeNodes(schema, '');

    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      path: 'emptyObj',
      name: 'emptyObj',
      type: 'object',
      children: [],
    });
  });

  test('should handle array with object items and add [0] to child paths', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        choices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              index: { type: 'integer' },
            },
          },
        },
      },
    };

    const nodes = schemaToTreeNodes(schema, '');

    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      path: 'choices',
      name: 'choices',
      type: 'array',
    });
    expect(nodes[0].children).toHaveLength(2);
    expect(nodes[0].children[0]).toMatchObject({
      path: 'choices[0].message',
      name: 'message',
      type: 'string',
      children: [],
    });
    expect(nodes[0].children[1]).toMatchObject({
      path: 'choices[0].index',
      name: 'index',
      type: 'integer',
      children: [],
    });
  });

  test('should not add children for array with non-object items', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        tags: { type: 'array', items: { type: 'string' } },
      },
    };

    const nodes = schemaToTreeNodes(schema, '');

    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({
      path: 'tags',
      name: 'tags',
      type: 'array',
      children: [],
    });
  });

  test('should not add children for array when items have no properties', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { type: 'object' },
        },
      },
    };

    const nodes = schemaToTreeNodes(schema, '');

    expect(nodes).toHaveLength(1);
    expect(nodes[0].children).toEqual([]);
  });

  test('should build deep paths through array then nested object', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        choices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: {
                type: 'object',
                properties: {
                  content: { type: 'string' },
                  role: { type: 'string' },
                },
              },
            },
          },
        },
      },
    };

    const nodes = schemaToTreeNodes(schema, '');

    const choices = nodes[0];
    expect(choices.path).toBe('choices');
    expect(choices.type).toBe('array');

    const message = choices.children[0];
    expect(message.path).toBe('choices[0].message');
    expect(message.type).toBe('object');
    expect(message.children).toHaveLength(2);

    expect(message.children[0]).toMatchObject({
      path: 'choices[0].message.content',
      name: 'content',
      type: 'string',
      children: [],
    });
    expect(message.children[1]).toMatchObject({
      path: 'choices[0].message.role',
      name: 'role',
      type: 'string',
      children: [],
    });
  });

  test('should handle multiple root properties with mixed types', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        count: { type: 'integer' },
        active: { type: 'boolean' },
        meta: {
          type: 'object',
          properties: {
            created: { type: 'string' },
          },
        },
      },
    };

    const nodes = schemaToTreeNodes(schema, '');

    expect(nodes).toHaveLength(4);
    expect(nodes.map((n) => n.path)).toEqual(['id', 'count', 'active', 'meta']);
    expect(nodes.map((n) => n.type)).toEqual(['string', 'integer', 'boolean', 'object']);
    expect(nodes[3].children).toHaveLength(1);
    expect(nodes[3].children[0]).toMatchObject({
      path: 'meta.created',
      name: 'created',
      type: 'string',
    });
  });

  test('should preserve full path chain for deeply nested objects', () => {
    const schema: JSONSchema7 = {
      type: 'object',
      properties: {
        a: {
          type: 'object',
          properties: {
            b: {
              type: 'object',
              properties: {
                c: { type: 'string' },
              },
            },
          },
        },
      },
    };

    const nodes = schemaToTreeNodes(schema, '');

    expect(nodes[0].path).toBe('a');
    expect(nodes[0].children[0].path).toBe('a.b');
    expect(nodes[0].children[0].children[0]).toMatchObject({
      path: 'a.b.c',
      name: 'c',
      type: 'string',
      children: [],
    });
  });
});
