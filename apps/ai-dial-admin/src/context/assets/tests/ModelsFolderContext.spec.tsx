import { PlatformAssetListItem } from '@/src/models/dial/asset-list-item';
import { DialFileNodeType } from '@/src/models/dial/file';
import { act, render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { ModelsFolderProvider, useModelsFolder } from '../ModelsFolderContext';

vi.mock('@/src/app/[lang]/platform-models/actions', () => ({ getModels: vi.fn() }));

import { getModels } from '@/src/app/[lang]/platform-models/actions';

const renderWithCapture = () => {
  let captured: ReturnType<typeof useModelsFolder> | null = null;

  const Capture = () => {
    captured = useModelsFolder();
    return null;
  };

  render(
    <ModelsFolderProvider>
      <Capture />
    </ModelsFolderProvider>,
  );

  return () => captured as ReturnType<typeof useModelsFolder>;
};

describe('useModelsFolder', () => {
  test('fetches through the real models action and shapes the response as flat PlatformAssetListItem rows', async () => {
    const item: PlatformAssetListItem = {
      name: 'gpt-4',
      path: 'platform/gpt-4',
      nodeType: DialFileNodeType.ITEM,
    } as PlatformAssetListItem;
    // `getModels` is typed by `assetApi.list`'s server-side `ResourceInfo[]` return (required
    // `folderId`), while `PlatformAssetListItem` deliberately declares none — the real response
    // still satisfies the client row shape at runtime, so the mock crosses that split explicitly.
    vi.mocked(getModels).mockResolvedValue([item] as unknown as Awaited<ReturnType<typeof getModels>>);

    const get = renderWithCapture();

    await act(async () => {
      get().fetchFiles('platform/');
    });

    // A flat platform view fetches exactly the single root it was given — there is no folder
    // hierarchy to expand beyond it. `fetchFiles` auto-expands the synthesized root on its first
    // call (see `AssetsFolderContext.tsx`), so `expandedFolders` holds only that root path, and
    // `data` is the root's items directly (see `design.md`'s platform-flavored contract, task 3.3).
    expect(getModels).toHaveBeenCalledWith('platform/');
    expect(get().data).toEqual([item]);
    expect(get().expandedFolders.size).toBe(1);
    expect(get().expandedFolders.has('platform/')).toBe(true);
  });
});
