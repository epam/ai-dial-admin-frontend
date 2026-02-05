import { describe, test, expect } from 'vitest';
import { convertSchemaToTable } from '../schema';

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
