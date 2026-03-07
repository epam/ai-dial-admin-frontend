import { describe, test, expect } from 'vitest';
import { JSONSchema7 } from 'json-schema';

import {
  getSchemaTypes,
  generateFieldId,
  createEmptyField,
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

  test('should not add nested properties for object/array without children', () => {
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
    expect(schema.properties!['empty']).toEqual({ type: 'object' });
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
