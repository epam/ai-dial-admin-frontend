import { describe, expect, test } from 'vitest';
import { extractTypes, getIsNullable, getType, getTypes, getItemsTypes, generateControlsFromScheme } from '../utils';

describe('extractTypes', () => {
  test('should extract types and $refs', () => {
    const types = extractTypes([{ type: 'string' }, { $ref: '#/definitions/User' }, { type: 'null' }]);
    expect(types).toEqual(['string', '#/definitions/User', 'null']);
  });

  test('should filter out empty values', () => {
    const types = extractTypes([{ type: undefined, $ref: undefined }]);
    expect(types).toEqual([]);
  });
});

describe('getIsNullable', () => {
  test('should return true if "null" is present in anyOf', () => {
    const prop = {
      anyOf: [{ type: 'string' }, { type: 'null' }],
    };
    expect(getIsNullable(prop)).toBe(true);
  });

  test('should return false if no "null" in anyOf', () => {
    const prop = {
      anyOf: [{ type: 'string' }],
    };
    expect(getIsNullable(prop)).toBe(false);
  });

  test('should return false if anyOf is undefined', () => {
    expect(getIsNullable({})).toBe(false);
  });
});

describe('getType', () => {
  test('should return type from anyOf if only one non-null', () => {
    const prop = {
      anyOf: [{ type: 'string' }, { type: 'null' }],
    };
    expect(getType(prop)).toBe('string');
  });

  test('should return undefined if multiple non-null types', () => {
    const prop = {
      anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }],
    };
    expect(getType(prop)).toBeUndefined();
  });

  test('should return undefined if oneOf exists', () => {
    const prop = {
      oneOf: [{ type: 'string' }],
    };
    expect(getType(prop)).toBeUndefined();
  });
});

describe('getTypes', () => {
  test('should extract types from oneOf and anyOf', () => {
    const prop = {
      oneOf: [{ type: 'string' }],
      anyOf: [{ type: 'array', items: { type: 'number' } }],
    };

    const result = getTypes(prop);
    expect(result).toEqual([
      { type: 'string', isArray: false, isMultiple: false },
      { type: 'number', isArray: true, isMultiple: true },
    ]);
  });

  test('should return empty array if no oneOf or anyOf', () => {
    expect(getTypes({})).toEqual([]);
  });
});

describe('getItemsTypes', () => {
  test('should extract items types from items.anyOf', () => {
    const prop = {
      items: {
        anyOf: [{ type: 'string' }, { $ref: '#/ref/User' }],
      },
    };
    expect(getItemsTypes(prop)).toEqual(['string', '#/ref/User']);
  });

  test('should extract items from anyOf[0].items', () => {
    const prop = {
      anyOf: [
        {
          items: {
            type: 'string',
          },
        },
      ],
    };
    expect(getItemsTypes(prop)).toEqual(['string']);
  });

  test('should extract items from anyOf[0].items.anyOf', () => {
    const prop = {
      anyOf: [
        {
          items: {
            anyOf: [{ type: 'number' }, { $ref: '#/ref/ID' }],
          },
        },
      ],
    };
    expect(getItemsTypes(prop)).toEqual(['number', '#/ref/ID']);
  });

  test('should return empty array if no valid items', () => {
    expect(getItemsTypes({})).toEqual([]);
  });
});

describe('generateControlsFromScheme', () => {
  test('should generate controls from simple scheme', () => {
    const scheme = {
      required: ['name'],
      properties: {
        name: { type: 'string', title: 'Full Name' },
        age: { anyOf: [{ type: 'number' }, { type: 'null' }], title: 'Age' },
        tags: {
          type: 'array',
          items: { anyOf: [{ type: 'string' }, { $ref: '#/ref/Tag' }] },
          title: 'Tags',
        },
        address: {
          anyOf: [
            {
              type: 'array',
              items: { type: 'string' },
            },
          ],
          title: 'Address',
        },
      },
    };

    const result = generateControlsFromScheme(scheme);

    expect(result).toEqual([
      {
        id: 'name',
        label: 'Full Name',
        type: 'string',
        optional: false,
        nullable: false,
      },
      {
        id: 'age',
        label: 'Age',
        type: 'number',
        optional: true,
        nullable: true,
      },
      {
        id: 'tags',
        label: 'Tags',
        type: 'array',
        itemsTypes: ['string', '#/ref/Tag'],
        optional: true,
        nullable: false,
      },
      {
        id: 'address',
        label: 'Address',
        itemsTypes: ['string'],
        optional: true,
        nullable: false,
        type: 'array',
      },
    ]);
  });
});
