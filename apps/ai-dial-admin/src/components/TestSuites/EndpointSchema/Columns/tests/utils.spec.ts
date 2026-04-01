import { describe, expect, test } from 'vitest';
import { JSONSchema7 } from 'json-schema';

import {
  buildArrayOperationsRows,
  buildConditionalsRows,
  buildMathStringRows,
  buildPathNavigationRows,
} from '../utils';

const EMPTY_SCHEMA: JSONSchema7 = { type: 'object' };
const NO_PROPERTIES_SCHEMA: JSONSchema7 = { type: 'string' };

const SIMPLE_SCHEMA: JSONSchema7 = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    age: { type: 'integer' },
    active: { type: 'boolean' },
  },
};

const NESTED_SCHEMA: JSONSchema7 = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    metadata: {
      type: 'object',
      properties: {
        createdAt: { type: 'string' },
        author: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
          },
        },
      },
    },
    score: { type: 'number' },
  },
};

const ARRAY_SCHEMA: JSONSchema7 = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          value: { type: 'number' },
          count: { type: 'integer' },
        },
      },
    },
  },
};

const MULTI_ARRAY_SCHEMA: JSONSchema7 = {
  type: 'object',
  properties: {
    results: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          score: { type: 'number' },
        },
      },
    },
    tags: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      },
    },
  },
};

const RICH_SCHEMA: JSONSchema7 = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    price: { type: 'number' },
    status: { type: 'string' },
    metadata: {
      type: 'object',
      properties: {
        category: { type: 'string' },
        rating: { type: 'number' },
      },
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          amount: { type: 'number' },
        },
      },
    },
  },
};

const ONLY_OBJECTS_SCHEMA: JSONSchema7 = {
  type: 'object',
  properties: {
    config: {
      type: 'object',
      properties: {
        key: { type: 'string' },
      },
    },
  },
};

const ONLY_NUMBERS_SCHEMA: JSONSchema7 = {
  type: 'object',
  properties: {
    count: { type: 'integer' },
    total: { type: 'number' },
  },
};

const ARRAY_NO_CHILDREN_SCHEMA: JSONSchema7 = {
  type: 'object',
  properties: {
    tags: {
      type: 'array',
      items: { type: 'string' },
    },
  },
};

describe('buildPathNavigationRows', () => {
  test('should return empty array for empty schema', () => {
    expect(buildPathNavigationRows(EMPTY_SCHEMA)).toEqual([]);
  });

  test('should return empty array for schema without properties', () => {
    expect(buildPathNavigationRows(NO_PROPERTIES_SCHEMA)).toEqual([]);
  });

  test('should return simple field rows for flat schema', () => {
    const rows = buildPathNavigationRows(SIMPLE_SCHEMA);

    expect(rows.length).toBeGreaterThanOrEqual(1);
    expect(rows[0]).toEqual({
      useCase: 'Simple field',
      expression: 'name',
      resultType: 'string',
    });
  });

  test('should include "Another top-level field" when multiple simple fields exist', () => {
    const rows = buildPathNavigationRows(SIMPLE_SCHEMA);
    const anotherField = rows.find((r) => r.useCase === 'Another top-level field');

    expect(anotherField).toBeDefined();
    expect(anotherField?.expression).toBe('age');
    expect(anotherField?.resultType).toBe('integer');
  });

  test('should include nested field row for schema with nested objects', () => {
    const rows = buildPathNavigationRows(NESTED_SCHEMA);
    const nestedRow = rows.find((r) => r.useCase === 'Nested field');

    expect(nestedRow).toBeDefined();
    expect(nestedRow?.expression).toContain('.');
  });

  test('should include deep nested path when path has more than 2 segments', () => {
    const rows = buildPathNavigationRows(NESTED_SCHEMA);
    const deepRow = rows.find((r) => r.useCase === 'Deep nested path');

    expect(deepRow).toBeDefined();
    expect(deepRow!.expression.split('.').length).toBeGreaterThan(2);
  });

  test('should include object field row for schema with objects', () => {
    const rows = buildPathNavigationRows(NESTED_SCHEMA);
    const objectRow = rows.find((r) => r.useCase === 'Object field');

    expect(objectRow).toBeDefined();
    expect(objectRow?.resultType).toBe('object');
    expect(objectRow?.expression).toBe('metadata');
  });

  test('should not include nested/deep rows for flat schema', () => {
    const rows = buildPathNavigationRows(SIMPLE_SCHEMA);

    expect(rows.find((r) => r.useCase === 'Nested field')).toBeUndefined();
    expect(rows.find((r) => r.useCase === 'Deep nested path')).toBeUndefined();
    expect(rows.find((r) => r.useCase === 'Object field')).toBeUndefined();
  });

  test('should handle schema with only object fields', () => {
    const rows = buildPathNavigationRows(ONLY_OBJECTS_SCHEMA);

    expect(rows.find((r) => r.useCase === 'Simple field')).toBeUndefined();
    expect(rows.find((r) => r.useCase === 'Object field')).toBeDefined();
  });
});

describe('buildArrayOperationsRows', () => {
  test('should return empty array for empty schema', () => {
    expect(buildArrayOperationsRows(EMPTY_SCHEMA)).toEqual([]);
  });

  test('should return empty array for schema without arrays', () => {
    expect(buildArrayOperationsRows(SIMPLE_SCHEMA)).toEqual([]);
  });

  test('should include "First element" row for array field', () => {
    const rows = buildArrayOperationsRows(ARRAY_SCHEMA);
    const firstElement = rows.find((r) => r.useCase === 'First element');

    expect(firstElement).toBeDefined();
    expect(firstElement?.expression).toBe('items[0]');
    expect(firstElement?.resultType).toBe('object');
  });

  test('should include "Map field from items" when array has children', () => {
    const rows = buildArrayOperationsRows(ARRAY_SCHEMA);
    const mapRow = rows.find((r) => r.useCase === 'Map field from items');

    expect(mapRow).toBeDefined();
    expect(mapRow?.expression).toBe('items.label');
    expect(mapRow?.resultType).toBe('string[]');
  });

  test('should include "Count elements" row', () => {
    const rows = buildArrayOperationsRows(ARRAY_SCHEMA);
    const countRow = rows.find((r) => r.useCase === 'Count elements');

    expect(countRow).toBeDefined();
    expect(countRow?.expression).toBe('$count(items)');
    expect(countRow?.resultType).toBe('number');
  });

  test('should include "Filter (predicate)" row with string child', () => {
    const rows = buildArrayOperationsRows(ARRAY_SCHEMA);
    const filterRow = rows.find((r) => r.useCase === 'Filter (predicate)');

    expect(filterRow).toBeDefined();
    expect(filterRow?.expression).toBe("items[label='value']");
    expect(filterRow?.resultType).toBe('array');
  });

  test('should include "Another array access" when multiple arrays exist', () => {
    const rows = buildArrayOperationsRows(MULTI_ARRAY_SCHEMA);
    const anotherArray = rows.find((r) => r.useCase === 'Another array access');

    expect(anotherArray).toBeDefined();
    expect(anotherArray?.expression).toBe('tags[0]');
  });

  test('should not include "Another array access" with single array', () => {
    const rows = buildArrayOperationsRows(ARRAY_SCHEMA);
    const anotherArray = rows.find((r) => r.useCase === 'Another array access');

    expect(anotherArray).toBeUndefined();
  });

  test('should handle array without object children', () => {
    const rows = buildArrayOperationsRows(ARRAY_NO_CHILDREN_SCHEMA);
    const firstElement = rows.find((r) => r.useCase === 'First element');

    expect(firstElement).toBeDefined();
    expect(firstElement?.resultType).toBe('any');
  });
});

describe('buildConditionalsRows', () => {
  test('should return empty array for empty schema', () => {
    expect(buildConditionalsRows(EMPTY_SCHEMA)).toEqual([]);
  });

  test('should return empty array for schema without properties', () => {
    expect(buildConditionalsRows(NO_PROPERTIES_SCHEMA)).toEqual([]);
  });

  test('should include "Conditional (ternary)" for schema with string fields', () => {
    const rows = buildConditionalsRows(SIMPLE_SCHEMA);
    const ternary = rows.find((r) => r.useCase === 'Conditional (ternary)');

    expect(ternary).toBeDefined();
    expect(ternary?.expression).toBe("name ? name : 'N/A'");
    expect(ternary?.resultType).toBe('string');
  });

  test('should include "Default if missing" for schema with simple fields', () => {
    const rows = buildConditionalsRows(SIMPLE_SCHEMA);
    const defaultRow = rows.find((r) => r.useCase === 'Default if missing');

    expect(defaultRow).toBeDefined();
    expect(defaultRow?.expression).toBe('$exists(name) ? name : null');
    expect(defaultRow?.resultType).toBe('string');
  });

  test('should include "Numeric comparison" when number fields exist', () => {
    const rows = buildConditionalsRows(SIMPLE_SCHEMA);
    const numRow = rows.find((r) => r.useCase === 'Numeric comparison');

    expect(numRow).toBeDefined();
    expect(numRow?.expression).toContain("> 0 ? 'positive' : 'zero or negative'");
    expect(numRow?.resultType).toBe('string');
  });

  test('should include "Empty array check" when array fields exist', () => {
    const rows = buildConditionalsRows(ARRAY_SCHEMA);
    const arrRow = rows.find((r) => r.useCase === 'Empty array check');

    expect(arrRow).toBeDefined();
    expect(arrRow?.expression).toBe('$count(items) > 0 ? items : []');
    expect(arrRow?.resultType).toBe('array');
  });

  test('should not include "Empty array check" for schema without arrays', () => {
    const rows = buildConditionalsRows(SIMPLE_SCHEMA);
    const arrRow = rows.find((r) => r.useCase === 'Empty array check');

    expect(arrRow).toBeUndefined();
  });

  test('should include "Existence check" row', () => {
    const rows = buildConditionalsRows(SIMPLE_SCHEMA);
    const existsRow = rows.find((r) => r.useCase === 'Existence check');

    expect(existsRow).toBeDefined();
    expect(existsRow?.expression).toContain('$exists(');
    expect(existsRow?.resultType).toBe('boolean');
  });

  test('should use same field for "Default if missing" and "Existence check" when only one simple field', () => {
    const singleFieldSchema: JSONSchema7 = {
      type: 'object',
      properties: {
        onlyField: { type: 'string' },
      },
    };
    const rows = buildConditionalsRows(singleFieldSchema);
    const defaultRow = rows.find((r) => r.useCase === 'Default if missing');
    const existsRow = rows.find((r) => r.useCase === 'Existence check');

    expect(defaultRow?.expression).toContain('onlyField');
    expect(existsRow?.expression).toContain('onlyField');
  });

  test('should not include "Numeric comparison" when no number fields exist', () => {
    const strOnlySchema: JSONSchema7 = {
      type: 'object',
      properties: {
        a: { type: 'string' },
        b: { type: 'string' },
      },
    };
    const rows = buildConditionalsRows(strOnlySchema);

    expect(rows.find((r) => r.useCase === 'Numeric comparison')).toBeUndefined();
  });
});

describe('buildMathStringRows', () => {
  test('should return empty array for empty schema', () => {
    expect(buildMathStringRows(EMPTY_SCHEMA)).toEqual([]);
  });

  test('should return empty array for schema without properties', () => {
    expect(buildMathStringRows(NO_PROPERTIES_SCHEMA)).toEqual([]);
  });

  test('should include string functions when string fields exist', () => {
    const rows = buildMathStringRows(SIMPLE_SCHEMA);

    const lengthRow = rows.find((r) => r.useCase === 'String length');
    expect(lengthRow).toBeDefined();
    expect(lengthRow?.expression).toBe('$length(name)');
    expect(lengthRow?.resultType).toBe('number');

    const upperRow = rows.find((r) => r.useCase === 'Uppercase');
    expect(upperRow).toBeDefined();
    expect(upperRow?.expression).toBe('$uppercase(name)');
    expect(upperRow?.resultType).toBe('string');

    const substrRow = rows.find((r) => r.useCase === 'Substring');
    expect(substrRow).toBeDefined();
    expect(substrRow?.expression).toBe('$substring(name, 0, 10)');
    expect(substrRow?.resultType).toBe('string');
  });

  test('should include "Round number" when number fields exist', () => {
    const rows = buildMathStringRows(SIMPLE_SCHEMA);
    const roundRow = rows.find((r) => r.useCase === 'Round number');

    expect(roundRow).toBeDefined();
    expect(roundRow?.expression).toContain('$round(');
    expect(roundRow?.resultType).toBe('number');
  });

  test('should include "Number to string" when number fields exist', () => {
    const rows = buildMathStringRows(SIMPLE_SCHEMA);
    const toStringRow = rows.find((r) => r.useCase === 'Number to string');

    expect(toStringRow).toBeDefined();
    expect(toStringRow?.expression).toContain('$string(');
    expect(toStringRow?.resultType).toBe('string');
  });

  test('should include sum/average rows when array has numeric children', () => {
    const rows = buildMathStringRows(ARRAY_SCHEMA);

    const sumRow = rows.find((r) => r.useCase === 'Sum array values');
    expect(sumRow).toBeDefined();
    expect(sumRow?.expression).toBe('$sum(items.value)');
    expect(sumRow?.resultType).toBe('number');

    const avgRow = rows.find((r) => r.useCase === 'Average array values');
    expect(avgRow).toBeDefined();
    expect(avgRow?.expression).toBe('$average(items.value)');
    expect(avgRow?.resultType).toBe('number');
  });

  test('should not include sum/average when array has no numeric children', () => {
    const strArraySchema: JSONSchema7 = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      },
    };
    const rows = buildMathStringRows(strArraySchema);

    expect(rows.find((r) => r.useCase === 'Sum array values')).toBeUndefined();
    expect(rows.find((r) => r.useCase === 'Average array values')).toBeUndefined();
  });

  test('should include "String concatenation" when only string fields and no numbers', () => {
    const strOnlySchema: JSONSchema7 = {
      type: 'object',
      properties: {
        label: { type: 'string' },
      },
    };
    const rows = buildMathStringRows(strOnlySchema);
    const concatRow = rows.find((r) => r.useCase === 'String concatenation');

    expect(concatRow).toBeDefined();
    expect(concatRow?.expression).toContain('$join(');
    expect(concatRow?.resultType).toBe('string');
  });

  test('should not include string functions when no string fields exist', () => {
    const rows = buildMathStringRows(ONLY_NUMBERS_SCHEMA);

    expect(rows.find((r) => r.useCase === 'String length')).toBeUndefined();
    expect(rows.find((r) => r.useCase === 'Uppercase')).toBeUndefined();
    expect(rows.find((r) => r.useCase === 'Substring')).toBeUndefined();
  });

  test('should include "Round number" for integer fields', () => {
    const rows = buildMathStringRows(ONLY_NUMBERS_SCHEMA);
    const roundRow = rows.find((r) => r.useCase === 'Round number');

    expect(roundRow).toBeDefined();
    expect(roundRow?.expression).toBe('$round(count, 2)');
  });

  test('should produce rows from rich schema covering all categories', () => {
    const rows = buildMathStringRows(RICH_SCHEMA);

    expect(rows.find((r) => r.useCase === 'String length')).toBeDefined();
    expect(rows.find((r) => r.useCase === 'Round number')).toBeDefined();
    expect(rows.find((r) => r.useCase === 'Sum array values')).toBeDefined();
    expect(rows.find((r) => r.useCase === 'Number to string')).toBeDefined();
  });
});
