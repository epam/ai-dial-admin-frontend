import { describe, test, expect } from 'vitest';
import { ToolFilter } from './type';
import { getFilteredTools } from './utils';

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
