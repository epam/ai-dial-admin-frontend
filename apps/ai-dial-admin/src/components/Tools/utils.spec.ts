import { describe, test, expect } from 'vitest';
import { AssetToolset } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';
import { ToolFilter } from './type';
import { getAllTools, getFilteredTools, getToolsContext } from './utils';

describe('getToolsContext', () => {
  test('defaults to an editable non-asset context with an empty name', () => {
    expect(getToolsContext({})).toEqual({
      isApplicationTools: false,
      isAssetToolset: false,
      isAssetApplication: false,
      isManagementVisible: true,
      toolSetName: '',
    });
  });

  test('uses the selected name for a direct application', () => {
    expect(
      getToolsContext({
        view: ApplicationRoute.Applications,
        originalEntity: { name: 'saved' },
        selectedEntity: { name: 'edited' },
      }),
    ).toEqual({
      isApplicationTools: true,
      isAssetToolset: false,
      isAssetApplication: false,
      isManagementVisible: true,
      toolSetName: 'edited',
    });
  });

  test('uses the saved path for a runner-backed asset application', () => {
    const saved: AssetToolset = {
      name: 'saved',
      path: 'public/saved',
      version: '1',
      _metadata: { name: 'saved', path: 'public/saved', folderId: 'public' },
    };
    const selected: AssetToolset = {
      name: 'edited',
      path: 'public/edited',
      version: '1',
      _metadata: { name: 'edited', path: 'public/edited', folderId: 'public' },
    };
    expect(
      getToolsContext({
        view: ApplicationRoute.AssetsApplications,
        isAsset: true,
        isRunnerApplication: true,
        originalEntity: saved,
        selectedEntity: selected,
      }),
    ).toEqual({
      isApplicationTools: true,
      isAssetToolset: false,
      isAssetApplication: true,
      isManagementVisible: false,
      toolSetName: 'public/saved',
    });
  });

  test('uses the saved name for a runner without asset metadata', () => {
    const context = getToolsContext({ isAsset: true, isRunnerApplication: true, originalEntity: { name: 'saved' } });
    expect(context.toolSetName).toBe('saved');
    expect(context.isAssetApplication).toBe(false);
  });

  test('uses the selected path for an asset toolset', () => {
    const selected: AssetToolset = {
      name: 'selected',
      path: 'public/selected',
      version: '1',
      _metadata: { name: 'selected', path: 'public/selected', folderId: 'public' },
    };
    const context = getToolsContext({
      view: ApplicationRoute.Toolsets,
      isAsset: true,
      selectedEntity: selected,
    });
    expect(context.isAssetToolset).toBe(true);
    expect(context.toolSetName).toBe('public/selected');
  });

  test.each([
    { disabled: true },
    { isMcpToolset: true },
    { isRunnerApplication: true },
    { appRunner: { name: 'runner' } },
  ])('hides management for restricted context %o', (options) => {
    expect(getToolsContext(options).isManagementVisible).toBe(false);
  });
});

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
