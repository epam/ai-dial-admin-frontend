import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { AppRunnerOption, AppRunnerOrigin } from '@/src/components/SourceField/Application/models';

const { getRunner, getConfigFileAppRunner, getResolvedRunnerSchema } = vi.hoisted(() => ({
  getRunner: vi.fn(),
  getConfigFileAppRunner: vi.fn(),
  getResolvedRunnerSchema: vi.fn(),
}));

vi.mock('@/src/app/[lang]/platform-app-runners/actions', () => ({
  getRunner,
  getConfigFileAppRunner,
  getResolvedRunnerSchema,
}));

import { useAssetRunnerDetails } from '@/src/components/Assets/Platform/use-asset-runner-details';

const details = {
  'dial:applicationTypeRoutes': {
    health: {
      'dial:paths': ['/health'],
      'dial:methods': ['GET'],
      'dial:upstreams': [],
    },
  },
  'dial:applicationTypeInterceptors': ['interceptor-1'],
  'dial:applicationTypeRateEndpoint': 'https://rate.example.com',
};

describe('useAssetRunnerDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('loads Config-origin runner details through the config-file action', async () => {
    getConfigFileAppRunner.mockResolvedValue({ success: true, data: details });
    const runner = { $id: 'config-runner', origin: AppRunnerOrigin.Config } as AppRunnerOption;

    const { result } = renderHook(() => useAssetRunnerDetails(runner));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getConfigFileAppRunner).toHaveBeenCalledOnce();
    expect(getConfigFileAppRunner).toHaveBeenCalledWith('config-runner');
    expect(getRunner).not.toHaveBeenCalled();
    expect(result.current.routes).toEqual(details['dial:applicationTypeRoutes']);
    expect(result.current.interceptors).toEqual(details['dial:applicationTypeInterceptors']);
    expect(result.current.features).toEqual(
      expect.objectContaining({ 'dial:applicationTypeRateEndpoint': 'https://rate.example.com' }),
    );
  });

  test('loads Platform-origin runner details through the resource action', async () => {
    getRunner.mockResolvedValue({ success: true, response: details });
    const runner = {
      $id: 'platform-runner',
      origin: AppRunnerOrigin.Platform,
      path: 'platform-runner-path',
    } as AppRunnerOption;

    const { result } = renderHook(() => useAssetRunnerDetails(runner));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getRunner).toHaveBeenCalledOnce();
    expect(getRunner).toHaveBeenCalledWith('platform-runner-path', '*');
    expect(getConfigFileAppRunner).not.toHaveBeenCalled();
    expect(result.current.routes).toEqual(details['dial:applicationTypeRoutes']);
  });

  test('loads details from a schema id without a runner option', async () => {
    getResolvedRunnerSchema.mockResolvedValue({ success: true, response: details });

    const { result } = renderHook(() => useAssetRunnerDetails(undefined, 'runner-id'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getResolvedRunnerSchema).toHaveBeenCalledOnce();
    expect(getResolvedRunnerSchema).toHaveBeenCalledWith('runner-id');
    expect(getRunner).not.toHaveBeenCalled();
    expect(getConfigFileAppRunner).not.toHaveBeenCalled();
    expect(result.current.routes).toEqual(details['dial:applicationTypeRoutes']);
  });

  test('exposes an error when resolving a schema id fails', async () => {
    getResolvedRunnerSchema.mockResolvedValue({ success: false, errorMessage: 'Schema unavailable' });

    const { result } = renderHook(() => useAssetRunnerDetails(undefined, 'runner-id'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('Schema unavailable');
    expect(result.current.routes).toBeNull();
  });

  test('exposes an error when the config-file runner read fails', async () => {
    getConfigFileAppRunner.mockResolvedValue({
      success: false,
      failure: { errorMessage: 'Config runner unavailable' },
    });
    const runner = { $id: 'config-runner', origin: AppRunnerOrigin.Config } as AppRunnerOption;

    const { result } = renderHook(() => useAssetRunnerDetails(runner));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe('Config runner unavailable');
    expect(result.current.routes).toBeNull();
  });
});
