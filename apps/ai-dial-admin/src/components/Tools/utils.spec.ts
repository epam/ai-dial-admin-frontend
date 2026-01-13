import { describe, test, expect } from 'vitest';
import { ToolFilter } from './type';
import { getFilteredTools } from './utils';

describe('getFilteredTools', () => {
  const tools = ['toolA', 'toolB', 'toolC'];
  const availableTools = [{ name: 'toolA' }, { name: 'toolC' }, { name: 'toolD' }];

  test('returns enabled tools', () => {
    const result = getFilteredTools(tools, [ToolFilter.Enabled], availableTools);
    expect(result).toEqual(['toolA', 'toolC']);
  });

  test('returns disabled tools', () => {
    const result = getFilteredTools(tools, [ToolFilter.Disabled], availableTools);
    expect(result).toEqual(['toolD']);
  });

  test('returns auto detected tools', () => {
    const result = getFilteredTools(tools, [ToolFilter.AutoDetected], availableTools);
    expect(result).toEqual(['toolA', 'toolC', 'toolD']);
  });

  test('returns added manually tools', () => {
    const result = getFilteredTools(tools, [ToolFilter.AddedManually], availableTools);
    expect(result).toEqual(['toolB']);
  });

  test('returns unique tools when multiple filters', () => {
    const result = getFilteredTools(
      tools,
      [ToolFilter.Enabled, ToolFilter.Disabled, ToolFilter.AutoDetected, ToolFilter.AddedManually],
      availableTools,
    );
    expect(result.sort()).toEqual(['toolA', 'toolB', 'toolC', 'toolD'].sort());
  });

  test('returns empty array if no filters', () => {
    const result = getFilteredTools(tools, [], availableTools);
    expect(result).toEqual([]);
  });
});
