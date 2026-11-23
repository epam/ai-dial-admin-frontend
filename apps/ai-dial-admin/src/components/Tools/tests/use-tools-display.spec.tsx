import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { useToolsDisplay } from '@/src/components/Tools/use-tools-display';

const tools = [
  { name: 'weather', description: 'Forecast' },
  { name: 'clock', description: 'Time' },
];

afterEach(() => vi.useRealTimers());

describe('useToolsDisplay', () => {
  test('filters the effective runner tools immediately by the settled search', () => {
    const { result } = renderHook(() =>
      useToolsDisplay({ tools, isApplicationTools: true, isAssetToolset: false, isRunnerApplication: true }),
    );
    expect(result.current.visibleTools).toEqual(tools);
    act(() => result.current.setSearch(' WEATHER '));
    expect(result.current.visibleTools).toEqual([tools[0]]);
  });

  test('keeps the no-tools sentinel until a toolset selects all tools', async () => {
    vi.useFakeTimers();
    const onChangeEntity = vi.fn();
    const toolset = { name: 'tools', allowedTools: [''] };
    const { result } = renderHook(() =>
      useToolsDisplay({
        tools,
        originalEntity: toolset,
        selectedEntity: toolset,
        isApplicationTools: false,
        isAssetToolset: false,
        onChangeEntity,
      }),
    );
    await act(async () => vi.advanceTimersByTimeAsync(300));
    expect(result.current.visibleTools).toEqual([]);
    act(() => result.current.onUseAllToolsSwitch(true));
    expect(onChangeEntity).toHaveBeenCalledWith({ name: 'tools', allowedTools: [] });
    await act(async () => vi.advanceTimersByTimeAsync(300));
    expect(result.current.visibleTools).toEqual(tools);
  });

  test('writes an asset toolset selection using the resource allowlist field', () => {
    const onChangeEntity = vi.fn();
    const toolset = { name: 'tools', allowed_tools: ['weather'] };
    const { result } = renderHook(() =>
      useToolsDisplay({
        tools,
        originalEntity: toolset,
        selectedEntity: toolset,
        isApplicationTools: false,
        isAssetToolset: true,
        onChangeEntity,
      }),
    );
    act(() => result.current.onUseAllToolsSwitch(true));
    expect(onChangeEntity).toHaveBeenCalledWith({ name: 'tools', allowed_tools: [] });
  });

  test('retains debounced description search for MCP containers', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useToolsDisplay({ tools, isApplicationTools: false, isAssetToolset: false, isMcpToolset: true }),
    );
    await act(async () => vi.advanceTimersByTimeAsync(300));
    expect(result.current.visibleTools).toEqual(tools);
    act(() => result.current.setSearch('forecast'));
    expect(result.current.visibleTools).toEqual(tools);
    await act(async () => vi.advanceTimersByTimeAsync(300));
    expect(result.current.visibleTools).toEqual([tools[0]]);
  });
});
