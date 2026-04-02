import { describe, expect, test } from 'vitest';

import {
  inferFieldMode,
  buildArgumentsFromTable,
  buildInitialArguments,
  extractBindingColumn,
  ArgumentRow,
} from '../utils';

describe('inferFieldMode', () => {
  test('returns binding for ${{...}} pattern', () => {
    expect(inferFieldMode('${{colName}}')).toBe('binding');
  });

  test('returns binding for empty binding placeholder', () => {
    expect(inferFieldMode('${{}}')).toBe('binding');
  });

  test('returns binding for binding with default value', () => {
    expect(inferFieldMode('${{colName:defaultValue}}')).toBe('binding');
  });

  test('returns constant for string literal', () => {
    expect(inferFieldMode('hello')).toBe('constant');
  });

  test('returns constant for number', () => {
    expect(inferFieldMode(42)).toBe('constant');
  });

  test('returns constant for boolean', () => {
    expect(inferFieldMode(true)).toBe('constant');
  });

  test('returns constant for object', () => {
    expect(inferFieldMode({ key: 'value' })).toBe('constant');
  });

  test('returns constant for null', () => {
    expect(inferFieldMode(null)).toBe('constant');
  });

  test('returns constant for undefined', () => {
    expect(inferFieldMode(undefined)).toBe('constant');
  });
});

describe('extractBindingColumn', () => {
  test('extracts column name from binding', () => {
    expect(extractBindingColumn('${{colName}}')).toBe('colName');
  });

  test('extracts column name from binding with default', () => {
    expect(extractBindingColumn('${{colName:defaultValue}}')).toBe('colName');
  });

  test('returns empty string for empty binding', () => {
    expect(extractBindingColumn('${{}}')).toBe('');
  });

  test('returns empty string for non-binding', () => {
    expect(extractBindingColumn('hello')).toBe('');
  });
});

describe('buildInitialArguments', () => {
  test('creates binding placeholders for simple types', () => {
    const schema = {
      properties: {
        query: { type: 'string' },
        count: { type: 'integer' },
      },
    };
    const result = buildInitialArguments(schema);
    expect(result).toEqual({
      query: '${{}}',
      count: '${{}}',
    });
  });

  test('creates empty object for object type', () => {
    const schema = {
      properties: {
        config: { type: 'object' },
      },
    };
    const result = buildInitialArguments(schema);
    expect(result).toEqual({ config: {} });
  });

  test('creates empty array for array type', () => {
    const schema = {
      properties: {
        items: { type: 'array' },
      },
    };
    const result = buildInitialArguments(schema);
    expect(result).toEqual({ items: [] });
  });

  test('returns empty object for undefined schema', () => {
    expect(buildInitialArguments(undefined)).toEqual({});
  });

  test('returns empty object for schema without properties', () => {
    expect(buildInitialArguments({})).toEqual({});
  });
});

describe('buildArgumentsFromTable', () => {
  test('builds arguments from rows', () => {
    const rows: ArgumentRow[] = [
      { name: 'query', type: 'string', mode: 'binding', value: '${{searchText}}' },
      { name: 'limit', type: 'integer', mode: 'constant', value: 10 },
      { name: 'verbose', type: 'boolean', mode: 'constant', value: true },
    ];
    const result = buildArgumentsFromTable(rows);
    expect(result).toEqual({
      query: '${{searchText}}',
      limit: 10,
      verbose: true,
    });
  });

  test('returns empty object for empty rows', () => {
    expect(buildArgumentsFromTable([])).toEqual({});
  });
});
