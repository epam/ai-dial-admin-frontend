import { beforeEach, describe, expect, test, vi } from 'vitest';

import { getContainerAssetNames } from '@/src/app/actions/container-asset-names';
import { ApplicationRoute } from '@/src/types/routes';

vi.mock('@/src/server/logger', () => ({ errorObjLog: vi.fn() }));
vi.mock('@/src/app/[lang]/platform-models/actions', () => ({
  getModels: vi.fn(),
  getConfigFileModels: vi.fn(),
}));
vi.mock('@/src/app/[lang]/platform-interceptors/actions', () => ({
  getInterceptors: vi.fn(),
  getConfigFileInterceptors: vi.fn(),
}));

import { getConfigFileInterceptors, getInterceptors } from '@/src/app/[lang]/platform-interceptors/actions';
import { getConfigFileModels, getModels } from '@/src/app/[lang]/platform-models/actions';
import { errorObjLog } from '@/src/server/logger';

describe('getContainerAssetNames', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('merges the platform-bucket and config-file model names', async () => {
    vi.mocked(getModels).mockResolvedValue([{ name: 'in-platform' }] as never);
    vi.mocked(getConfigFileModels).mockResolvedValue({ success: true, data: ['in-config-file'] });

    expect(await getContainerAssetNames(ApplicationRoute.PlatformModels)).toEqual(['in-platform', 'in-config-file']);
    expect(getModels).toHaveBeenCalledWith('platform/');
  });

  test('reads the interceptor populations for the interceptor view', async () => {
    vi.mocked(getInterceptors).mockResolvedValue([{ name: 'icpt' }] as never);
    vi.mocked(getConfigFileInterceptors).mockResolvedValue({ success: true, data: [] });

    expect(await getContainerAssetNames(ApplicationRoute.PlatformInterceptors)).toEqual(['icpt']);
  });

  test('keeps the names that loaded when the other read fails', async () => {
    vi.mocked(getModels).mockRejectedValue(new Error('down'));
    vi.mocked(getConfigFileModels).mockResolvedValue({ success: false, failure: {} } as never);

    expect(await getContainerAssetNames(ApplicationRoute.PlatformModels)).toEqual([]);
    expect(errorObjLog).toHaveBeenCalledTimes(2);
  });

  test('keeps the config-file names when only the platform listing fails', async () => {
    vi.mocked(getModels).mockRejectedValue(new Error('down'));
    vi.mocked(getConfigFileModels).mockResolvedValue({ success: true, data: ['in-config-file'] });

    expect(await getContainerAssetNames(ApplicationRoute.PlatformModels)).toEqual(['in-config-file']);
  });

  test('returns no names for a view without a flat platform population', async () => {
    expect(await getContainerAssetNames(ApplicationRoute.AssetsToolsets)).toEqual([]);
    expect(getModels).not.toHaveBeenCalled();
  });
});
