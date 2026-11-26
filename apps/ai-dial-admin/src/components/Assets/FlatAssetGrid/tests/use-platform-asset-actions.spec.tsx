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
import { bulkDeleteAliases, createAlias, getAlias } from '@/src/app/[lang]/assets-aliases/actions';
import { bulkDeleteModels, createModel, getModel } from '@/src/app/[lang]/platform-models/actions';
import { bulkDeletePolicies } from '@/src/app/[lang]/platform-policies/actions';
import { bulkDeletePolicyAssignments } from '@/src/app/[lang]/platform-policy-assignments/actions';
import { AssetTabsI18nKey, ErrorI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { AssetListItem, BucketType } from '@/src/models/dial/asset-list-item';
import { AssetSource } from '@/src/models/dial/asset-source';
import { AssetWithVersion } from '@/src/models/dial/deployment-asset';
import { NotificationType } from '@/src/models/notification';
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

vi.mock('@/src/app/[lang]/assets-aliases/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/assets-aliases/actions')>()),
  getAlias: vi.fn().mockResolvedValue({ success: true, response: { name: 'search', path: 'public/search' } }),
  createAlias: vi.fn().mockResolvedValue({ success: true, response: {} }),
  bulkDeleteAliases: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/src/app/[lang]/platform-models/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/platform-models/actions')>()),
  getModel: vi.fn().mockResolvedValue({ success: true, response: { name: 'gpt', path: 'platform/gpt' } }),
  createModel: vi.fn().mockResolvedValue({ success: true, response: {} }),
  bulkDeleteModels: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/src/app/[lang]/platform-policies/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/platform-policies/actions')>()),
  bulkDeletePolicies: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/src/app/[lang]/platform-policy-assignments/actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/src/app/[lang]/platform-policy-assignments/actions')>()),
  bulkDeletePolicyAssignments: vi.fn().mockResolvedValue({ success: true }),
}));

const row = (name: string): AssetListItem => ({ name, path: `platform/${name}`, bucket: BucketType.Platform });

describe('usePlatformAssetActions', () => {
  const push = vi.fn();
  const refetch = vi.fn().mockResolvedValue(undefined);
  const { showNotification } = useNotification();

  const renderActions = (
    view: ApplicationRoute,
    source: AssetSource.Public | AssetSource.Platform = AssetSource.Platform,
  ) => renderHook(() => usePlatformAssetActions({ view, source, refetch }));

  beforeEach(() => {
    vi.clearAllMocks();
    refetch.mockResolvedValue(undefined);
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
      expect(await result.current.onDelete()).toBe(true);
    });

    expect(bulkDeleteModels).toHaveBeenCalledOnce();
    expect(refetch).toHaveBeenCalledOnce();
    expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ type: NotificationType.success }));
  });

  test.each([
    [ApplicationRoute.PlatformPolicies, bulkDeletePolicies],
    [ApplicationRoute.PlatformPolicyAssignments, bulkDeletePolicyAssignments],
  ] as const)('deletes %s records by their full cost-object paths', async (view, bulkDelete) => {
    const { result } = renderActions(view);
    const selected = [
      { ...row('cap'), path: 'platform/team-a/cap' },
      { ...row('cap'), path: 'platform/team-b/cap' },
    ];

    act(() => result.current.onOpenDelete(selected));
    await act(async () => {
      await result.current.onDelete();
    });

    expect(bulkDelete).toHaveBeenCalledWith([
      { path: 'platform/team-a/cap', etag: expect.anything() },
      { path: 'platform/team-b/cap', etag: expect.anything() },
    ]);
  });

  test('reports the error and refreshes after a partial delete failure', async () => {
    vi.mocked(bulkDeleteModels).mockResolvedValueOnce({
      success: false,
      errorHeader: 'Conflict',
      errorMessage: 'In use',
      requestId: 'request-123',
    });
    const { result } = renderActions(ApplicationRoute.PlatformModels);

    act(() => result.current.onOpenDelete([row('first'), row('second')]));
    await act(async () => {
      expect(await result.current.onDelete()).toBe(false);
    });

    expect(showNotification).toHaveBeenCalledOnce();
    expect(showNotification).toHaveBeenCalledWith(getErrorNotification('Conflict', 'In use', 'request-123'));
    expect(refetch).toHaveBeenCalledOnce();
  });

  test('reports a rejected delete and refreshes without a success notification', async () => {
    vi.mocked(bulkDeleteModels).mockRejectedValueOnce(new Error('Network error'));
    const { result } = renderActions(ApplicationRoute.PlatformModels);

    act(() => result.current.onOpenDelete([row('gpt')]));
    await act(async () => {
      expect(await result.current.onDelete()).toBe(false);
    });

    expect(showNotification).toHaveBeenCalledOnce();
    expect(showNotification).toHaveBeenCalledWith(getErrorNotification(ErrorI18nKey.ServerError, 'Network error'));
    expect(refetch).toHaveBeenCalledOnce();
  });

  test('reports a rejected refresh separately from a successful delete', async () => {
    refetch.mockRejectedValueOnce(new Error('Refresh failed'));
    const { result } = renderActions(ApplicationRoute.PlatformModels);

    act(() => result.current.onOpenDelete([row('gpt')]));
    await act(async () => {
      expect(await result.current.onDelete()).toBe(false);
    });

    expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ type: NotificationType.success }));
    expect(showNotification).toHaveBeenCalledWith(getErrorNotification(AssetTabsI18nKey.LoadError));
    expect(refetch).toHaveBeenCalledOnce();
  });

  test('prevents duplicate requests across an unmount and refreshes the original source', async () => {
    let finishDelete: () => void = () => {};
    const pending = new Promise<void>((resolve) => {
      finishDelete = resolve;
    });
    vi.mocked(bulkDeleteAliases).mockImplementationOnce(async () => {
      await pending;
      return { success: true };
    });
    const publicRefetch = vi.fn().mockResolvedValue(undefined);
    const platformRefetch = vi.fn().mockResolvedValue(undefined);
    const { result, unmount } = renderHook(() =>
      usePlatformAssetActions({
        view: ApplicationRoute.AssetsAliases,
        source: AssetSource.Public,
        refetch: publicRefetch,
      }),
    );
    act(() => result.current.onOpenDelete([{ name: 'a', path: 'public/a', bucket: BucketType.Public }]));
    const onDelete = result.current.onDelete;
    let deletion!: Promise<boolean>;
    act(() => {
      deletion = onDelete();
    });
    expect(await onDelete()).toBe(false);
    unmount();

    const platform = renderHook(() =>
      usePlatformAssetActions({
        view: ApplicationRoute.AssetsAliases,
        source: AssetSource.Platform,
        refetch: platformRefetch,
      }),
    );
    const publicAgain = renderHook(() =>
      usePlatformAssetActions({
        view: ApplicationRoute.AssetsAliases,
        source: AssetSource.Public,
        refetch: publicRefetch,
      }),
    );
    act(() => publicAgain.result.current.onOpenDelete([{ name: 'a', path: 'public/a', bucket: BucketType.Public }]));
    expect(publicAgain.result.current.modalType).toBeNull();
    expect(bulkDeleteAliases).toHaveBeenCalledOnce();

    await act(async () => {
      finishDelete();
      expect(await deletion).toBe(true);
    });
    expect(publicRefetch).toHaveBeenCalledOnce();
    expect(platformRefetch).not.toHaveBeenCalled();
    act(() => publicAgain.result.current.onOpenDelete([{ name: 'a', path: 'public/a', bucket: BucketType.Public }]));
    expect(publicAgain.result.current.modalType).toBe(PlatformModalType.Delete);
    platform.unmount();
  });

  test('opens no delete modal for an empty selection', () => {
    const { result } = renderActions(ApplicationRoute.PlatformModels);

    act(() => result.current.onOpenDelete([]));

    expect(result.current.modalType).toBeNull();
  });

  describe('aliases, which live in both buckets as flat rows', () => {
    const aliasRow = (name: string, bucket: 'public' | 'platform'): AssetListItem => ({
      name,
      path: `${bucket}/${name}`,
      bucket: bucket === 'public' ? BucketType.Public : BucketType.Platform,
    });

    test('reads the duplicate source through the generic alias getter, not a bucket-specific one', async () => {
      const { result } = renderActions(ApplicationRoute.AssetsAliases, AssetSource.Public);

      await act(async () => {
        await result.current.onOpenDuplicate(aliasRow('search', 'public'));
      });

      expect(getAlias).toHaveBeenCalledWith('public/search', expect.anything());
      expect(result.current.modalType).toBe(PlatformModalType.Duplicate);
    });

    test('duplicates a Public alias into the public bucket', async () => {
      const { result } = renderActions(ApplicationRoute.AssetsAliases, AssetSource.Public);

      await act(async () => {
        await result.current.onDuplicate({ name: 'search-copy', path: 'public/search' } as unknown as AssetWithVersion);
      });

      expect(createAlias).toHaveBeenCalledWith(expect.objectContaining({ name: 'search-copy', folderId: 'public/' }));
      expect(push).toHaveBeenCalledWith(expect.stringContaining('/assets-aliases/search-copy?path='));
    });

    test('duplicates a Platform alias into the platform bucket and redirects to the bare name', async () => {
      const { result } = renderActions(ApplicationRoute.AssetsAliases, AssetSource.Platform);

      await act(async () => {
        await result.current.onDuplicate({
          name: 'assistant-copy',
          path: 'platform/assistant',
        } as unknown as AssetWithVersion);
      });

      expect(createAlias).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'assistant-copy', folderId: 'platform/' }),
      );
      expect(push).toHaveBeenCalledWith('/assets-aliases/assistant-copy');
    });

    test.each([AssetSource.Public, AssetSource.Platform] as const)(
      'bulk deletes %s aliases without touching the other bucket',
      async (source) => {
        const { result } = renderActions(ApplicationRoute.AssetsAliases, source);

        act(() => result.current.onOpenDelete([aliasRow('same-name', source), aliasRow('other', source)]));
        await act(async () => {
          await result.current.onDelete();
        });

        expect(bulkDeleteAliases).toHaveBeenCalledWith([
          { path: `${source}/same-name`, etag: expect.anything() },
          { path: `${source}/other`, etag: expect.anything() },
        ]);
        expect(refetch).toHaveBeenCalledOnce();
      },
    );
  });
});
