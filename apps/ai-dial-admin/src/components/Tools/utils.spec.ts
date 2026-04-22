import { describe, test, expect } from 'vitest';
import { ToolFilter } from './type';
import { getAllTools, getFilteredTools } from './utils';

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

describe('getAllTools', () => {
  const allToolNames = ['toolA', 'toolB', 'toolC'];
  const runnerTools = ['toolA', 'toolB'];
  const allowedTools = ['toolC'];

  test('returns all tool names when useAllTools is true', () => {
    const result = getAllTools(true, allToolNames, false, runnerTools, allowedTools);
    expect(result).toEqual(allToolNames);
  });

  test('useAllTools takes priority over isAppRunner', () => {
    const result = getAllTools(true, allToolNames, true, runnerTools, allowedTools);
    expect(result).toEqual(allToolNames);
  });

  test('returns runner tools when isAppRunner and runnerTools is non-empty', () => {
    const result = getAllTools(false, allToolNames, true, runnerTools, allowedTools);
    expect(result).toEqual(runnerTools);
  });

  test('falls back to all tool names when isAppRunner but runnerTools is empty', () => {
    const result = getAllTools(false, allToolNames, true, [], allowedTools);
    expect(result).toEqual(allToolNames);
  });

  test('returns allowed tools when not useAllTools and not isAppRunner', () => {
    const result = getAllTools(false, allToolNames, false, runnerTools, allowedTools);
    expect(result).toEqual(allowedTools);
  });
});
