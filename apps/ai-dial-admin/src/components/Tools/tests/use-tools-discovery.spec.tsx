import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import * as applicationActions from '@/src/app/[lang]/applications/actions';
import * as assetApplicationActions from '@/src/app/[lang]/assets-applications/actions';
import * as assetToolsetActions from '@/src/app/[lang]/assets-toolsets/actions';
import * as toolsetActions from '@/src/app/[lang]/toolsets/actions';
import * as deploymentActions from '@/src/app/actions/deployments';
import { ToolsDiscoveryParams } from '@/src/components/Tools/models';
import { useToolsDiscovery } from '@/src/components/Tools/use-tools-discovery';
import { useNotification } from '@/src/context/NotificationContext';
import { getErrorNotification } from '@/src/utils/notification';

const response = { success: true, response: { tools: [{ name: 'weather' }] } };
const saved = { name: 'saved', _metadata: { path: 'public/saved' } };
const selected = { name: 'edited', _metadata: { path: 'public/edited' } };

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('useToolsDiscovery', () => {
  test.each([
    { isApplicationTools: true, isAsset: false, action: 'application', path: 'edited' },
    { isApplicationTools: true, isAsset: true, action: 'asset application', path: 'public/edited' },
    { isApplicationTools: false, isAsset: false, action: 'toolset', path: 'edited' },
    { isApplicationTools: false, isAsset: true, action: 'asset toolset', path: 'public/edited' },
  ])('uses the selected identity for $action discovery', async ({ isApplicationTools, isAsset, action, path }) => {
    const application = vi.spyOn(applicationActions, 'getTools').mockResolvedValue(response);
    const assetApplication = vi.spyOn(assetApplicationActions, 'getAssetTools').mockResolvedValue(response);
    const toolset = vi.spyOn(toolsetActions, 'getTools').mockResolvedValue(response);
    const assetToolset = vi.spyOn(assetToolsetActions, 'getAssetTools').mockResolvedValue(response);
    const actions = { application, 'asset application': assetApplication, toolset, 'asset toolset': assetToolset };
    const { result } = renderHook(() =>
      useToolsDiscovery({ originalEntity: saved, selectedEntity: selected, isApplicationTools, isAsset }),
    );

    await waitFor(() => expect(result.current.tools).toEqual(response.response.tools));
    expect(result.current.isLoading).toBe(false);
    expect(actions[action as keyof typeof actions]).toHaveBeenCalledWith(path);
    expect(Object.values(actions).filter((mock) => mock.mock.calls.length)).toHaveLength(1);
  });

  test('loads runner tools by the saved asset path and ignores selected edits', async () => {
    const getAllowedTools = vi.spyOn(assetApplicationActions, 'getAssetAllowedTools').mockResolvedValue(response);
    const { result, rerender } = renderHook((params: ToolsDiscoveryParams) => useToolsDiscovery(params), {
      initialProps: {
        originalEntity: saved,
        selectedEntity: selected,
        isRunnerApplication: true,
        isAsset: true,
        isApplicationTools: true,
      },
    });
    await waitFor(() => expect(result.current.tools).toEqual(response.response.tools));
    rerender({
      originalEntity: saved,
      selectedEntity: { ...selected, name: 'new edit' },
      isRunnerApplication: true,
      isAsset: true,
      isApplicationTools: true,
    });
    expect(getAllowedTools).toHaveBeenCalledOnce();
    expect(getAllowedTools).toHaveBeenCalledWith('public/saved');
  });

  test('starts runner discovery in the loading state and falls back to the saved name', async () => {
    let resolveRequest: (value: typeof response) => void = () => {};
    const getAllowedTools = vi.spyOn(applicationActions, 'getAllowedTools').mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );
    const renderStates: boolean[] = [];
    const { result } = renderHook(() => {
      const state = useToolsDiscovery({
        originalEntity: { name: 'saved' },
        isRunnerApplication: true,
        isAsset: true,
        isApplicationTools: true,
      });
      renderStates.push(state.isLoading);
      return state;
    });
    expect(renderStates[0]).toBe(true);
    expect(result.current.isLoading).toBe(true);
    expect(getAllowedTools).toHaveBeenCalledWith('saved');
    await act(async () => resolveRequest(response));
    expect(result.current.tools).toEqual(response.response.tools);
    expect(result.current.isLoading).toBe(false);
  });

  test('notifies and clears tools when runner discovery throws', async () => {
    vi.spyOn(applicationActions, 'getAllowedTools').mockRejectedValue(new Error('failed'));
    const { result } = renderHook(() =>
      useToolsDiscovery({ originalEntity: saved, isRunnerApplication: true, isApplicationTools: true }),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tools).toEqual([]);
    expect(useNotification().showNotification).toHaveBeenCalledWith(getErrorNotification(undefined, 'failed'));
  });

  test('ignores a stale normal discovery response after the selected entity changes', async () => {
    let resolveFirst: (value: typeof response) => void = () => {};
    const getTools = vi.spyOn(applicationActions, 'getTools');
    getTools.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFirst = resolve;
      }),
    );
    getTools.mockResolvedValueOnce({ success: true, response: { tools: [{ name: 'new' }] } });
    const { result, rerender } = renderHook((params: ToolsDiscoveryParams) => useToolsDiscovery(params), {
      initialProps: { selectedEntity: saved, isApplicationTools: true },
    });
    rerender({ selectedEntity: selected, isApplicationTools: true });
    await waitFor(() => expect(result.current.tools).toEqual([{ name: 'new' }]));
    await act(async () => resolveFirst(response));
    expect(result.current.tools).toEqual([{ name: 'new' }]);
  });

  test('ignores a stale runner failure after the saved identity changes', async () => {
    let rejectFirst: (reason: Error) => void = () => {};
    const getAllowedTools = vi.spyOn(applicationActions, 'getAllowedTools');
    getAllowedTools.mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectFirst = reject;
      }),
    );
    getAllowedTools.mockResolvedValueOnce(response);
    const { result, rerender } = renderHook((params: ToolsDiscoveryParams) => useToolsDiscovery(params), {
      initialProps: { originalEntity: saved, isRunnerApplication: true, isApplicationTools: true },
    });
    rerender({ originalEntity: selected, isRunnerApplication: true, isApplicationTools: true });
    await waitFor(() => expect(result.current.tools).toEqual(response.response.tools));
    await act(async () => rejectFirst(new Error('stale failure')));
    expect(result.current.tools).toEqual(response.response.tools);
    expect(result.current.isLoading).toBe(false);
    expect(useNotification().showNotification).not.toHaveBeenCalled();
  });

  test('loads container tools and suppresses normal discovery', async () => {
    const getTools = vi.spyOn(applicationActions, 'getTools');
    const getContainerTools = vi.spyOn(deploymentActions, 'getContainerTools').mockResolvedValue(response);
    const { result } = renderHook(() =>
      useToolsDiscovery({
        selectedEntity: selected,
        isApplicationTools: true,
        isMcpToolset: true,
        containerId: 'container',
      }),
    );
    await waitFor(() => expect(result.current.tools).toEqual(response.response.tools));
    expect(result.current.isLoading).toBe(false);
    expect(getContainerTools).toHaveBeenCalledWith('container');
    expect(getTools).not.toHaveBeenCalled();
  });

  test('notifies on a normal discovery failure', async () => {
    vi.spyOn(applicationActions, 'getTools').mockResolvedValue({
      success: false,
      errorHeader: 'Error',
      errorMessage: 'failed',
    });
    const { result } = renderHook(() => useToolsDiscovery({ selectedEntity: selected, isApplicationTools: true }));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.tools).toEqual([]);
    expect(useNotification().showNotification).toHaveBeenCalledWith(getErrorNotification('Error', 'failed'));
  });
});
