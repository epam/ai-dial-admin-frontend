import { Asset } from '@/src/models/dial/deployment-asset';
import { DialFileNodeType } from '@/src/models/dial/file';
import { act, render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { AssetsFolderContext, createFolderContext } from '../AssetsFolderContext';

vi.unmock('@/src/context/assets/AssetsFolderContext');

const renderProviderWithCapture = (getFiles: (path: string) => Promise<Asset[] | null | undefined>) => {
  const { Provider, useFolderContext } = createFolderContext(getFiles, 'testFolder');

  let captured: AssetsFolderContext | null = null;

  const Capture = () => {
    captured = useFolderContext();
    return null;
  };

  render(
    <Provider>
      <Capture />
    </Provider>,
  );

  return () => captured as AssetsFolderContext;
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
    const items: Asset[] = [
      { name: 'asset-1', path: '/folder/asset-1', nodeType: DialFileNodeType.ITEM } as Asset,
      { name: 'asset-2', path: '/folder/asset-2', nodeType: DialFileNodeType.ITEM } as Asset,
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
    const platformItems: Asset[] = [
      { name: 'runner-1', path: 'platform/runner-1', nodeType: DialFileNodeType.ITEM } as Asset,
    ];
    const publicItems: Asset[] = [{ name: 'app-1', path: 'public/app-1', nodeType: DialFileNodeType.ITEM } as Asset];
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

  test('opens the last given root by default, keeping single-root views unaffected', async () => {
    const getFiles = vi.fn().mockResolvedValue([]);
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles(['platform/', 'public/']);
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
    let resolvePlatform: (value: Asset[]) => void = () => {};
    const getFiles = vi.fn((path: string) =>
      path === 'platform/'
        ? new Promise<Asset[]>((resolve) => {
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
