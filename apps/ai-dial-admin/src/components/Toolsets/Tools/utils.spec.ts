import { describe, it, expect } from 'vitest';
import { getFilteredTools } from './utils';
import { ToolFilter } from './type';

describe('getFilteredTools', () => {
  const tools = ['toolA', 'toolB', 'toolC'];
  const availableTools = ['toolA', 'toolC', 'toolD'];

  it('returns enabled tools', () => {
    const result = getFilteredTools(tools, [ToolFilter.Enabled], availableTools);
    expect(result).toEqual(['toolA', 'toolC']);
  });

  it('returns disabled tools', () => {
    const result = getFilteredTools(tools, [ToolFilter.Disabled], availableTools);
    expect(result).toEqual(['toolD']);
  });

  it('returns auto detected tools', () => {
    const result = getFilteredTools(tools, [ToolFilter.AutoDetected], availableTools);
    expect(result).toEqual(['toolA', 'toolC', 'toolD']);
  });

  it('returns added manually tools', () => {
    const result = getFilteredTools(tools, [ToolFilter.AddedManually], availableTools);
    expect(result).toEqual(['toolB']);
  });

  it('returns unique tools when multiple filters', () => {
    const result = getFilteredTools(tools, [ToolFilter.Enabled, ToolFilter.Disabled, ToolFilter.AutoDetected, ToolFilter.AddedManually], availableTools);
    expect(result.sort()).toEqual(['toolA', 'toolB', 'toolC', 'toolD'].sort());
  });

  it('returns empty array if no filters', () => {
    const result = getFilteredTools(tools, [], availableTools);
    expect(result).toEqual([]);
  });
});
