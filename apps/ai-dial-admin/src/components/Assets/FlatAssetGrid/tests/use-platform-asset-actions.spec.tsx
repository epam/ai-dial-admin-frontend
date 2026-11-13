import { act, renderHook } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import {
  bulkDeleteApps,
  bulkDeletePlatformApplications,
  createApp,
  createPlatformApplication,
  getPlatformApplication,
} from '@/src/app/[lang]/assets-applications/actions';
import {
  bulkDeletePlatformToolsets,
  createPlatformToolset,
  createToolset,
  getPlatformToolset,
} from '@/src/app/[lang]/assets-toolsets/actions';
import { bulkDeleteModels, createModel, getModel } from '@/src/app/[lang]/platform-models/actions';
import { useNotification } from '@/src/context/NotificationContext';
import { AssetListItem, BucketType } from '@/src/models/dial/asset-list-item';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { ApplicationRoute } from '@/src/types/routes';
import { getErrorNotification } from '@/src/utils/notification';
import { PlatformModalType, usePlatformAssetActions } from '../use-platform-asset-actions';

vi.mock('@/src/app/[lang]/assets-applications/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/assets-applications/actions')>()),
  getApp: vi.fn(),
  createApp: vi.fn(),
  bulkDeleteApps: vi.fn(),
  getPlatformApplication: vi
    .fn()
    .mockResolvedValue({ success: true, response: { name: 'platform-app', path: 'platform/platform-app' } }),
  createPlatformApplication: vi.fn().mockResolvedValue({ success: true, response: {} }),
  bulkDeletePlatformApplications: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/src/app/[lang]/assets-toolsets/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/assets-toolsets/actions')>()),
  getToolset: vi.fn(),
  createToolset: vi.fn(),
  getPlatformToolset: vi
    .fn()
    .mockResolvedValue({ success: true, response: { name: 'platform-toolset', path: 'platform/platform-toolset' } }),
  createPlatformToolset: vi.fn().mockResolvedValue({ success: true, response: {} }),
  bulkDeletePlatformToolsets: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/src/app/[lang]/platform-models/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/platform-models/actions')>()),
  getModel: vi.fn().mockResolvedValue({ success: true, response: { name: 'gpt', path: 'platform/gpt' } }),
  createModel: vi.fn().mockResolvedValue({ success: true, response: {} }),
  bulkDeleteModels: vi.fn().mockResolvedValue({ success: true }),
}));

const row = (name: string): AssetListItem => ({ name, path: `platform/${name}`, bucket: BucketType.Platform });

describe('usePlatformAssetActions', () => {
  const push = vi.fn();
  const refetch = vi.fn().mockResolvedValue(undefined);
  const { showNotification } = useNotification();

  const renderActions = (view: ApplicationRoute) => renderHook(() => usePlatformAssetActions({ view, refetch }));

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({ push } as unknown as ReturnType<typeof useRouter>);
  });

  test.each([
    [ApplicationRoute.AssetsApplications, getPlatformApplication, 'platform-app'],
    [ApplicationRoute.AssetsToolsets, getPlatformToolset, 'platform-toolset'],
  ] as const)('reads the duplicate source of a %s row through the platform getter', async (view, platformGet, name) => {
    const { result } = renderActions(view);

    await act(async () => {
      await result.current.onOpenDuplicate(row(name));
    });

    expect(platformGet).toHaveBeenCalledWith(`platform/${name}`, expect.anything());
    expect(result.current.modalType).toBe(PlatformModalType.Duplicate);
    expect(result.current.duplicateItem).toMatchObject({ name });
  });

  test('reads the duplicate source of a flat platform row through the view getter', async () => {
    const { result } = renderActions(ApplicationRoute.PlatformModels);

    await act(async () => {
      await result.current.onOpenDuplicate(row('gpt'));
    });

    expect(getModel).toHaveBeenCalledWith('platform/gpt', expect.anything());
  });

  test.each([
    [ApplicationRoute.AssetsApplications, createPlatformApplication, createApp, '/assets-applications/copy-of-app'],
    [ApplicationRoute.AssetsToolsets, createPlatformToolset, createToolset, '/assets-toolsets/copy-of-app'],
  ] as const)(
    'duplicates a %s row through the platform create action and redirects to the bare name',
    async (view, platformCreate, publicCreate, url) => {
      const { result } = renderActions(view);

      await act(async () => {
        await result.current.onDuplicate({
          name: 'copy-of-app',
          path: 'platform/app',
          folderId: 'platform/',
        } as unknown as AssetWithVersion);
      });

      expect(platformCreate).toHaveBeenCalledOnce();
      expect(publicCreate).not.toHaveBeenCalled();
      expect(push).toHaveBeenCalledWith(url);
      expect(refetch).toHaveBeenCalledOnce();
    },
  );

  test('duplicates a flat platform row through the view create action', async () => {
    const { result } = renderActions(ApplicationRoute.PlatformModels);

    await act(async () => {
      await result.current.onDuplicate({ name: 'gpt-copy', path: 'platform/gpt' } as unknown as AssetWithVersion);
    });

    expect(createModel).toHaveBeenCalledOnce();
  });

  test.each([
    [ApplicationRoute.AssetsApplications, createPlatformApplication],
    [ApplicationRoute.AssetsToolsets, createPlatformToolset],
  ] as const)('reports a failed %s duplicate once and does not redirect', async (view, platformCreate) => {
    vi.mocked(platformCreate).mockResolvedValueOnce({
      success: false,
      errorHeader: 'Conflict',
      errorMessage: 'Already exists',
      requestId: 'request-123',
    });
    const { result } = renderActions(view);

    await act(async () => {
      await result.current.onDuplicate({ name: 'copy', path: 'platform/app' } as unknown as AssetWithVersion);
    });

    expect(showNotification).toHaveBeenCalledOnce();
    expect(showNotification).toHaveBeenCalledWith(getErrorNotification('Conflict', 'Already exists', 'request-123'));
    expect(push).not.toHaveBeenCalled();
    expect(refetch).not.toHaveBeenCalled();
  });

  test.each([
    [ApplicationRoute.AssetsApplications, bulkDeletePlatformApplications, bulkDeleteApps],
    [ApplicationRoute.AssetsToolsets, bulkDeletePlatformToolsets, undefined],
  ] as const)('bulk deletes %s rows through the platform action', async (view, platformDelete, publicDelete) => {
    const { result } = renderActions(view);

    act(() => result.current.onOpenDelete([row('a'), row('b')]));
    expect(result.current.modalType).toBe(PlatformModalType.Delete);
    await act(async () => {
      await result.current.onDelete();
    });

    expect(platformDelete).toHaveBeenCalledWith([
      { path: 'platform/a', etag: expect.anything() },
      { path: 'platform/b', etag: expect.anything() },
    ]);
    if (publicDelete) {
      expect(publicDelete).not.toHaveBeenCalled();
    }
    expect(refetch).toHaveBeenCalledOnce();
    expect(result.current.modalType).toBeNull();
  });

  test('bulk deletes flat platform rows through the view action', async () => {
    const { result } = renderActions(ApplicationRoute.PlatformModels);

    act(() => result.current.onOpenDelete([row('gpt')]));
    await act(async () => {
      await result.current.onDelete();
    });

    expect(bulkDeleteModels).toHaveBeenCalledOnce();
  });

  test('reports the error and does not refetch when a delete fails', async () => {
    vi.mocked(bulkDeleteModels).mockResolvedValueOnce({
      success: false,
      errorHeader: 'Conflict',
      errorMessage: 'In use',
    });
    const { result } = renderActions(ApplicationRoute.PlatformModels);

    act(() => result.current.onOpenDelete([row('gpt')]));
    await act(async () => {
      await result.current.onDelete();
    });

    expect(showNotification).toHaveBeenCalledWith(getErrorNotification('Conflict', 'In use', undefined));
    expect(refetch).not.toHaveBeenCalled();
  });

  test('opens no delete modal for an empty selection', () => {
    const { result } = renderActions(ApplicationRoute.PlatformModels);

    act(() => result.current.onOpenDelete([]));

    expect(result.current.modalType).toBeNull();
  });
});
