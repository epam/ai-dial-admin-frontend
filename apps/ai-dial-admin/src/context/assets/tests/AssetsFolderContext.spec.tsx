import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { DialFileNodeType } from '@/src/models/dial/file';
import { act, render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { AssetsFolderContext, createFolderContext } from '../AssetsFolderContext';

vi.unmock('@/src/context/assets/AssetsFolderContext');

const renderProviderWithCapture = (
  getFiles: (path: string) => Promise<AssetListItem[] | null | undefined>,
  getConfigFileNames?: () => Promise<string[] | null | undefined>,
) => {
  const { Provider, useFolderContext } = createFolderContext(getFiles, 'testFolder', getConfigFileNames);

  let captured: AssetsFolderContext<AssetListItem> | null = null;

  const Capture = () => {
    captured = useFolderContext();
    return null;
  };

  render(
    <Provider>
      <Capture />
    </Provider>,
  );

  return () => captured as AssetsFolderContext<AssetListItem>;
};

describe('createFolderContext data initial state', () => {
  test('data is null on first render before any fetch resolves', () => {
    const getFiles = vi.fn().mockResolvedValue([]);
    const get = renderProviderWithCapture(getFiles);

    expect(get().data).toBeNull();
  });

  test('data becomes [] after fetching an empty folder', async () => {
    const getFiles = vi.fn().mockResolvedValue([]);
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('/folder/');
    });

    expect(get().data).toEqual([]);
  });

  test('data holds folder items after fetching a populated folder', async () => {
    const items: AssetListItem[] = [
      { name: 'asset-1', path: '/folder/asset-1', nodeType: DialFileNodeType.ITEM } as AssetListItem,
      { name: 'asset-2', path: '/folder/asset-2', nodeType: DialFileNodeType.ITEM } as AssetListItem,
    ];
    const getFiles = vi.fn().mockResolvedValue(items);
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('/folder/');
    });

    expect(get().data).toEqual(items);
  });

  test('data becomes null when fetch resolves undefined (error path)', async () => {
    const getFiles = vi.fn().mockResolvedValue(undefined);
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('/folder/');
    });

    expect(get().data).toBeNull();
  });
});

describe('createFolderContext fetchFiles with multiple root paths', () => {
  test('fetches every given root and orders them as given in files', async () => {
    const platformItems: AssetListItem[] = [
      { name: 'runner-1', path: 'platform/runner-1', nodeType: DialFileNodeType.ITEM } as AssetListItem,
    ];
    const publicItems: AssetListItem[] = [
      { name: 'app-1', path: 'public/app-1', nodeType: DialFileNodeType.ITEM } as AssetListItem,
    ];
    const getFiles = vi.fn((path: string) => Promise.resolve(path === 'platform/' ? platformItems : publicItems));
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles(['platform/', 'public/']);
    });

    expect(getFiles).toHaveBeenCalledWith('platform/');
    expect(getFiles).toHaveBeenCalledWith('public/');
    expect(get().files).toHaveLength(2);
    expect(get().files[0].path).toBe('platform/');
    expect(get().files[1].path).toBe('public/');
    expect(get().fetchedFoldersData['platform/']).toEqual(platformItems);
    expect(get().fetchedFoldersData['public/']).toEqual(publicItems);
  });

  test('loads file names with physical roots and reuses the cached file list', async () => {
    const platformItems: AssetListItem[] = [
      { name: 'runner-1', path: 'platform/runner-1', nodeType: DialFileNodeType.ITEM } as AssetListItem,
    ];
    const publicItems: AssetListItem[] = [
      { name: 'app-1', path: 'public/app-1', nodeType: DialFileNodeType.ITEM } as AssetListItem,
    ];
    const getFiles = vi.fn((path: string) => Promise.resolve(path === 'platform/' ? platformItems : publicItems));
    const getConfigFileNames = vi.fn().mockResolvedValue(['file-app']);
    const get = renderProviderWithCapture(getFiles, getConfigFileNames);

    await act(async () => {
      get().fetchFiles(['file/', 'platform/', 'public/']);
    });

    expect(getConfigFileNames).toHaveBeenCalledOnce();
    expect(getFiles).toHaveBeenCalledWith('platform/');
    expect(getFiles).toHaveBeenCalledWith('public/');
    expect(getFiles).not.toHaveBeenCalledWith('file/');
    expect(get().fetchedFoldersData['file/']).toMatchObject([
      { name: 'file-app', path: 'file-app', nodeType: DialFileNodeType.ITEM, entitySource: 'file' },
    ]);
    expect(get().filePath).toBe('public/');

    await act(async () => {
      get().toggleFolder(get().files[0]);
    });

    expect(getConfigFileNames).toHaveBeenCalledOnce();
    expect(get().data).toEqual(get().fetchedFoldersData['file/']);
  });

  test('keeps physical roots available when the file names request fails', async () => {
    const platformItems: AssetListItem[] = [
      { name: 'runner-1', path: 'platform/runner-1', nodeType: DialFileNodeType.ITEM } as AssetListItem,
    ];
    const publicItems: AssetListItem[] = [
      { name: 'app-1', path: 'public/app-1', nodeType: DialFileNodeType.ITEM } as AssetListItem,
    ];
    const getFiles = vi.fn((path: string) => Promise.resolve(path === 'platform/' ? platformItems : publicItems));
    const getConfigFileNames = vi.fn().mockResolvedValue(undefined);
    const get = renderProviderWithCapture(getFiles, getConfigFileNames);

    await act(async () => {
      get().fetchFiles(['file/', 'platform/', 'public/']);
    });

    expect(get().files.map((file) => file.path)).toEqual(['file/', 'platform/', 'public/']);
    expect(get().fetchedFoldersData['platform/']).toEqual(platformItems);
    expect(get().fetchedFoldersData['public/']).toEqual(publicItems);
    expect(get().data).toEqual(publicItems);

    await act(async () => {
      get().toggleFolder(get().files[0]);
    });

    expect(getConfigFileNames).toHaveBeenCalledOnce();
  });
  test('opens the last physical root by default, keeping file-first views on the existing resource view', async () => {
    const getFiles = vi.fn().mockResolvedValue([]);
    const getConfigFileNames = vi.fn().mockResolvedValue([]);
    const get = renderProviderWithCapture(getFiles, getConfigFileNames);

    await act(async () => {
      get().fetchFiles(['file/', 'platform/', 'public/']);
    });

    expect(get().filePath).toBe('public/');
    expect(get().data).toEqual([]);
  });

  test('sets data to null when any root fetch resolves undefined', async () => {
    const getFiles = vi.fn((path: string) => Promise.resolve(path === 'platform/' ? undefined : []));
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles(['platform/', 'public/']);
    });

    expect(get().data).toBeNull();
  });

  test('isFetchingFiles reflects the combined multi-root fetch, not just one root', async () => {
    let resolvePlatform: (value: AssetListItem[]) => void = () => {};
    const getFiles = vi.fn((path: string) =>
      path === 'platform/'
        ? new Promise<AssetListItem[]>((resolve) => {
            resolvePlatform = resolve;
          })
        : Promise.resolve([]),
    );
    const get = renderProviderWithCapture(getFiles);

    act(() => {
      get().fetchFiles(['platform/', 'public/']);
    });

    expect(get().isFetchingFiles).toBe(true);

    await act(async () => {
      resolvePlatform([]);
    });

    expect(get().isFetchingFiles).toBe(false);
  });
});
