import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { readFlatAssets } from '@/src/components/Assets/FlatAssetGrid/readers';
import { AssetTabsI18nKey } from '@/src/constants/i18n';
import { useNotification } from '@/src/context/NotificationContext';
import { AssetListItem, BucketType } from '@/src/models/dial/asset-list-item';
import { AssetSource } from '@/src/models/dial/asset-source';
import { NotificationType } from '@/src/models/notification';
import { ApplicationRoute } from '@/src/types/routes';
import { useFlatAssets } from '../use-flat-assets';

vi.mock('@/src/components/Assets/FlatAssetGrid/readers', () => ({ readFlatAssets: vi.fn() }));

const VIEW = ApplicationRoute.PlatformModels;
const row = (name: string): AssetListItem => ({ name, path: `platform/${name}`, bucket: BucketType.Platform });

describe('useFlatAssets', () => {
  const { showNotification } = useNotification();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('loads the rows on mount and counts them', async () => {
    vi.mocked(readFlatAssets).mockResolvedValue({ success: true, rows: [row('a'), row('b')] });

    const { result } = renderHook(() => useFlatAssets(VIEW, AssetSource.Platform));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.count).toBeUndefined();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(readFlatAssets).toHaveBeenCalledWith(VIEW, AssetSource.Platform);
    expect(result.current.rows).toHaveLength(2);
    expect(result.current.count).toBe(2);
    expect(result.current.hasError).toBe(false);
  });

  test('keeps a real zero as a count', async () => {
    vi.mocked(readFlatAssets).mockResolvedValue({ success: true, rows: [] });

    const { result } = renderHook(() => useFlatAssets(VIEW, AssetSource.Platform));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.count).toBe(0);
  });

  test('reports a failed read once, with no count and no rows', async () => {
    vi.mocked(readFlatAssets).mockResolvedValue({ success: false, errorHeader: 'Boom', errorMessage: 'No access' });

    const { result } = renderHook(() => useFlatAssets(VIEW, AssetSource.ConfigFile));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.hasError).toBe(true);
    expect(result.current.count).toBeUndefined();
    expect(result.current.rows).toEqual([]);
    expect(showNotification).toHaveBeenCalledTimes(1);
    expect(showNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.error, title: 'Boom', description: 'No access' }),
    );
  });

  test('titles a failure that carries no header with the load-error key', async () => {
    vi.mocked(readFlatAssets).mockResolvedValue({ success: false });

    const { result } = renderHook(() => useFlatAssets(VIEW, AssetSource.Platform));

    await waitFor(() => expect(result.current.hasError).toBe(true));
    expect(showNotification).toHaveBeenCalledWith(expect.objectContaining({ title: AssetTabsI18nKey.LoadError }));
  });

  test('treats a rejected read as a failed read', async () => {
    vi.mocked(readFlatAssets).mockRejectedValue(new Error('network'));

    const { result } = renderHook(() => useFlatAssets(VIEW, AssetSource.Platform));

    await waitFor(() => expect(result.current.hasError).toBe(true));
    expect(result.current.count).toBeUndefined();
    expect(showNotification).toHaveBeenCalledTimes(1);
  });

  test('never reads a source the listing does not offer', async () => {
    const { result } = renderHook(() => useFlatAssets(VIEW, AssetSource.ConfigFile, false));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.count).toBeUndefined();
    expect(readFlatAssets).not.toHaveBeenCalled();
  });

  test('ignores a stale answer once a newer read has started', async () => {
    let resolveFirst: (value: Awaited<ReturnType<typeof readFlatAssets>>) => void = () => undefined;
    vi.mocked(readFlatAssets)
      .mockImplementationOnce(() => new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce({ success: true, rows: [row('fresh')] });

    const { result } = renderHook(() => useFlatAssets(VIEW, AssetSource.Platform));
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.rows.map((item) => item.name)).toEqual(['fresh']);

    await act(async () => {
      resolveFirst({ success: true, rows: [row('stale')] });
    });

    expect(result.current.rows.map((item) => item.name)).toEqual(['fresh']);
  });

  test('refetch reads again', async () => {
    vi.mocked(readFlatAssets).mockResolvedValue({ success: true, rows: [row('a')] });
    const { result } = renderHook(() => useFlatAssets(VIEW, AssetSource.Platform));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await result.current.refetch();
    });

    expect(readFlatAssets).toHaveBeenCalledTimes(2);
  });
});
