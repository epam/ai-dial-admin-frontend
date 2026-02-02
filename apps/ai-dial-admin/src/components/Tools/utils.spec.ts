import { describe, test, expect } from 'vitest';
import { ToolFilter } from './type';
import { convertSchemaToTable, getFilteredTools } from './utils';

describe('getFilteredTools', () => {
  const tools = ['toolA', 'toolB', 'toolC'];
  const availableTools = [{ name: 'toolA' }, { name: 'toolC' }, { name: 'toolD' }];

  test('returns auto detected tools', () => {
    const result = getFilteredTools(tools, [ToolFilter.AutoDetected], availableTools);
    expect(result).toEqual([{ name: 'toolA' }, { name: 'toolC' }]);
  });

  test('returns added manually tools', () => {
    const result = getFilteredTools(tools, [ToolFilter.AddedManually], availableTools);
    expect(result).toEqual([{ name: 'toolB' }]);
  });

  test('returns unique tools when multiple filters', () => {
    const result = getFilteredTools(tools, [ToolFilter.AutoDetected, ToolFilter.AddedManually], availableTools);
    expect(result).toEqual([{ name: 'toolA' }, { name: 'toolC' }, { name: 'toolB' }]);
  });

  test('returns empty array if no filters', () => {
    const result = getFilteredTools(tools, [], availableTools);
    expect(result).toEqual([]);
  });
});

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
