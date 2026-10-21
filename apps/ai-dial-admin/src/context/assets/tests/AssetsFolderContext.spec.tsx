import { AssetListItem, BucketType, EntitySource } from '@/src/models/dial/asset-list-item';
import { DialFile, DialFileNodeType } from '@/src/models/dial/file';
import { StrictMode } from 'react';
import { act, render } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { AssetsFolderContext, createFolderContext } from '../AssetsFolderContext';

vi.unmock('@/src/context/assets/AssetsFolderContext');

// Tree nodes carry their children in `items`, which the row type does not declare.
const getChildren = (node?: AssetListItem | DialFile) => (node as DialFile | undefined)?.items;

const createItem = (path: string) =>
  ({ name: path.split('/').at(-1), path, nodeType: DialFileNodeType.ITEM }) as AssetListItem;

const createFolder = (path: string) =>
  ({ name: path.split('/').filter(Boolean).at(-1), path, nodeType: DialFileNodeType.FOLDER }) as AssetListItem;

const createDeferred = <T,>() => {
  let resolve: (value: T) => void = () => {};
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
};

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

describe('createFolderContext initial and fetched state', () => {
  test('has nothing cached and no error on first render, before any fetch resolves', () => {
    const getFiles = vi.fn().mockResolvedValue([]);
    const get = renderProviderWithCapture(getFiles);

    expect(get().fetchedFoldersData).toEqual({});
    expect(get().hasFetchError).toBe(false);
  });

  test('caches [] after fetching an empty folder', async () => {
    const getFiles = vi.fn().mockResolvedValue([]);
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('/folder/');
    });

    expect(get().fetchedFoldersData['/folder/']).toEqual([]);
  });

  test('caches the folder items after fetching a populated folder', async () => {
    const items: AssetListItem[] = [
      { name: 'asset-1', path: '/folder/asset-1', nodeType: DialFileNodeType.ITEM } as AssetListItem,
      { name: 'asset-2', path: '/folder/asset-2', nodeType: DialFileNodeType.ITEM } as AssetListItem,
    ];
    const getFiles = vi.fn().mockResolvedValue(items);
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('/folder/');
    });

    expect(get().fetchedFoldersData['/folder/']).toEqual(items);
  });

  test('flags an error and caches nothing when the fetch resolves undefined', async () => {
    const getFiles = vi.fn().mockResolvedValue(undefined);
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('/folder/');
    });

    expect(get().hasFetchError).toBe(true);
    expect(get().fetchedFoldersData).toEqual({});
  });

  test('clears the error once a later fetch succeeds', async () => {
    const getFiles = vi.fn().mockResolvedValueOnce(undefined).mockResolvedValue([]);
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('/folder/');
    });
    await act(async () => {
      get().fetchFiles('/folder/');
    });

    expect(get().hasFetchError).toBe(false);
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
    expect(get().filePath).toBe('file/');
    expect(get().fetchedFoldersData['file/']).toHaveLength(1);
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
    expect(get().fetchedFoldersData[get().filePath]).toEqual(publicItems);

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
    expect(get().fetchedFoldersData['public/']).toEqual([]);
  });

  test('flags an error when any root fetch resolves undefined', async () => {
    const getFiles = vi.fn((path: string) => Promise.resolve(path === 'platform/' ? undefined : []));
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles(['platform/', 'public/']);
    });

    expect(get().hasFetchError).toBe(true);
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

describe('createFolderContext fetchFiles with a single path', () => {
  test('merges the first load into a root node, expands it and selects it', async () => {
    const getFiles = vi.fn().mockResolvedValue([createFolder('root/sub/'), createItem('root/item')]);
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('root/');
    });

    expect(get().files).toHaveLength(1);
    expect(get().files[0]).toMatchObject({ path: 'root/', nodeType: DialFileNodeType.FOLDER });
    expect(getChildren(get().files[0])?.map((child) => child.path)).toEqual(['root/item', 'root/sub/']);
    expect([...get().expandedFolders]).toEqual(['root/']);
    expect(get().filePath).toBe('root/');
    expect(get().fetchedFoldersData['root/']).toEqual([createItem('root/item')]);
  });

  test('merges a later load into the tree without expanding or selecting it', async () => {
    const getFiles = vi.fn((path: string) =>
      Promise.resolve(path === 'root/' ? [createFolder('root/sub/')] : [createItem('root/sub/leaf')]),
    );
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('root/');
    });
    await act(async () => {
      get().fetchFiles('root/sub/');
    });

    const sub = getChildren(get().files[0])?.find((child) => child.path === 'root/sub/');
    expect(getChildren(sub)?.map((child) => child.path)).toEqual(['root/sub/leaf']);
    expect([...get().expandedFolders]).toEqual(['root/']);
    expect(get().filePath).toBe('root/');
    expect(Object.keys(get().fetchedFoldersData)).toEqual(['root/', 'root/sub/']);
  });

  test('replaces the whole cache when refreshData is set', async () => {
    const getFiles = vi.fn().mockResolvedValue([]);
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('root/');
    });
    await act(async () => {
      get().fetchFiles('other/', true);
    });

    expect(Object.keys(get().fetchedFoldersData)).toEqual(['other/']);
  });

  test('keeps the selected folder unless resetFolder is set', async () => {
    const getFiles = vi.fn().mockResolvedValue([]);
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('a/');
    });
    await act(async () => {
      get().fetchFiles('b/');
    });

    expect(get().filePath).toBe('a/');

    await act(async () => {
      get().fetchFiles('b/', false, true);
    });

    expect(get().filePath).toBe('b/');
  });

  test('leaves the tree untouched when the fetch fails', async () => {
    const getFiles = vi.fn().mockResolvedValue(undefined);
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('root/');
    });

    expect(get().files).toEqual([]);
    expect(get().fetchedFoldersData).toEqual({});
    expect(get().isFetchingFiles).toBe(false);
  });
});

describe('createFolderContext fetchFolderHierarchy', () => {
  const getHierarchyFiles = vi.fn((path: string) =>
    Promise.resolve(path === 'a/' ? [createFolder('a/b/'), createItem('a/x')] : [createItem('a/b/leaf')]),
  );

  test('builds only the branch down to the target folder by default', async () => {
    const get = renderProviderWithCapture(getHierarchyFiles);

    await act(async () => {
      get().fetchFolderHierarchy?.('a/b/');
    });

    expect(get().files).toHaveLength(1);
    expect(get().files[0].path).toBe('a/');
    expect(getChildren(get().files[0])?.map((child) => child.path)).toEqual(['a/b/']);
    expect([...get().expandedFolders]).toEqual(['a/', 'a/b/']);
    expect(get().filePath).toBe('a/b/');
    expect(get().fetchedFoldersData).toEqual({ 'a/': [createItem('a/x')], 'a/b/': [createItem('a/b/leaf')] });
    expect(get().fetchedFoldersData[get().filePath]).toEqual([createItem('a/b/leaf')]);
  });

  test('keeps every sibling along the way when fullTree is set', async () => {
    const get = renderProviderWithCapture(getHierarchyFiles);

    await act(async () => {
      get().fetchFolderHierarchy?.('a/b/', true);
    });

    const root = get().files[0];
    expect(getChildren(root)?.map((child) => child.path)).toEqual(['a/b/', 'a/x']);
    expect(getChildren(getChildren(root)?.find((child) => child.path === 'a/b/'))?.map((child) => child.path)).toEqual([
      'a/b/leaf',
    ]);
  });

  test('adds a placeholder node when a level is empty', async () => {
    const get = renderProviderWithCapture(vi.fn().mockResolvedValue([]));

    await act(async () => {
      get().fetchFolderHierarchy?.('a/b/');
    });

    expect(getChildren(get().files[0])).toMatchObject([{ name: 'b', path: 'a/b/', nodeType: DialFileNodeType.FOLDER }]);
    expect(get().filePath).toBe('a/b/');
    expect(get().fetchedFoldersData['a/b/']).toEqual([]);
  });

  // The placeholder is named after the current segment (a), not the missing one (b): this branch passes
  // pathParts[index] where the empty-level branch passes pathParts[index + 1]. Looks like an off-by-one;
  // pinned as-is because fixing it is outside this change.
  test('names the placeholder after the current segment when the next folder is missing from a non-empty level', async () => {
    const get = renderProviderWithCapture(vi.fn().mockResolvedValue([createItem('a/x')]));

    await act(async () => {
      get().fetchFolderHierarchy?.('a/b/');
    });

    expect(getChildren(get().files[0])).toMatchObject([{ name: 'a', path: 'a/b/', nodeType: DialFileNodeType.FOLDER }]);
  });

  test('flags an error and keeps the tree empty when a level fails', async () => {
    const getFiles = vi.fn((path: string) => Promise.resolve(path === 'a/' ? undefined : []));
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFolderHierarchy?.('a/b/');
    });

    expect(get().hasFetchError).toBe(true);
    expect(get().files).toEqual([]);
    expect(get().isFetchingFiles).toBe(false);
  });

  test('is fetching while a level is pending and idle once it settles', async () => {
    const deferred = createDeferred<AssetListItem[]>();
    const get = renderProviderWithCapture(vi.fn(() => deferred.promise));

    act(() => {
      get().fetchFolderHierarchy?.('a/');
    });

    expect(get().isFetchingFiles).toBe(true);

    await act(async () => {
      deferred.resolve([]);
    });

    expect(get().isFetchingFiles).toBe(false);
  });

  test('ignores a path without a folder separator', async () => {
    const getFiles = vi.fn().mockResolvedValue([]);
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFolderHierarchy?.('abc');
    });

    expect(getFiles).not.toHaveBeenCalled();
    expect(get().isFetchingFiles).toBe(false);
  });
});

describe('createFolderContext toggleFolder', () => {
  const renderWithRoots = async () => {
    const getFiles = vi.fn().mockResolvedValue([createItem('platform/runner')]);
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles(['platform/', 'public/']);
    });
    getFiles.mockClear();

    return { get, getFiles };
  };

  test('expands a cached folder from the cache without fetching', async () => {
    const { get, getFiles } = await renderWithRoots();

    await act(async () => {
      get().toggleFolder(get().files[0]);
    });

    expect(getFiles).not.toHaveBeenCalled();
    expect(get().expandedFolders.has('platform/')).toBe(true);
    expect(get().filePath).toBe('platform/');
  });

  test('fetches a folder that is not cached yet', async () => {
    const { get, getFiles } = await renderWithRoots();

    await act(async () => {
      get().toggleFolder(createFolder('platform/new/'));
    });

    expect(getFiles).toHaveBeenCalledWith('platform/new/');
    expect(get().expandedFolders.has('platform/new/')).toBe(true);
  });

  test('collapses an expanded folder and shows its cached items again', async () => {
    const { get } = await renderWithRoots();

    await act(async () => {
      get().toggleFolder(get().files[0]);
    });
    await act(async () => {
      get().toggleFolder(get().files[0]);
    });

    expect(get().expandedFolders.has('platform/')).toBe(false);
    expect(get().filePath).toBe('platform/');
  });

  test('selects and expands without fetching when skipFetch is set', async () => {
    const { get, getFiles } = await renderWithRoots();
    await act(async () => {
      get().toggleFolder(createFolder('platform/new/'), true);
    });

    expect(getFiles).not.toHaveBeenCalled();
    expect(get().expandedFolders.has('platform/new/')).toBe(true);
    expect(get().filePath).toBe('platform/new/');
  });

  test('collapses every other folder when collapseAll is set', async () => {
    const { get } = await renderWithRoots();

    expect([...get().expandedFolders]).toEqual(['public/']);

    await act(async () => {
      get().toggleFolder(get().files[0], false, true);
    });

    expect([...get().expandedFolders]).toEqual(['platform/']);
  });

  test('flags an error for a config-file root whose names failed to load, without refetching them', async () => {
    const getConfigFileNames = vi.fn().mockResolvedValue(undefined);
    const get = renderProviderWithCapture(vi.fn().mockResolvedValue([]), getConfigFileNames);

    await act(async () => {
      get().fetchFiles(['file/', 'platform/', 'public/']);
    });
    await act(async () => {
      get().toggleFolder(get().files[0]);
    });

    expect(get().hasFetchError).toBe(true);
    expect(getConfigFileNames).toHaveBeenCalledOnce();
  });
});

describe('createFolderContext config-file root', () => {
  test('maps the file names to read-only platform items', async () => {
    const get = renderProviderWithCapture(vi.fn().mockResolvedValue([]), vi.fn().mockResolvedValue(['one', 'two']));

    await act(async () => {
      get().fetchFiles(['file/', 'platform/']);
    });

    expect(get().fetchedFoldersData['file/']).toEqual([
      expect.objectContaining({
        name: 'one',
        path: 'one',
        nodeType: DialFileNodeType.ITEM,
        bucket: BucketType.Platform,
        entitySource: EntitySource.File,
      }),
      expect.objectContaining({ name: 'two', path: 'two' }),
    ]);
  });

  test('has no config-file items when the view supplies no names loader', async () => {
    const get = renderProviderWithCapture(vi.fn().mockResolvedValue([]));

    await act(async () => {
      get().fetchFiles(['file/', 'platform/']);
    });

    expect(get().fetchedFoldersData['file/']).toEqual([]);
  });
});

describe('createFolderContext hook', () => {
  test('throws when used outside its provider', () => {
    const { useFolderContext } = createFolderContext(vi.fn(), 'testFolder');
    const Consumer = () => {
      useFolderContext();
      return null;
    };

    expect(() => render(<Consumer />)).toThrow('testFolder must be used within its Provider');
  });
});

describe('createFolderContext selected folder', () => {
  test('keeps the selected folder and its items when another folder is fetched', async () => {
    const getFiles = vi.fn((path: string) =>
      Promise.resolve(path === 'a/' ? [createItem('a/one')] : [createItem('b/two')]),
    );
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('a/');
    });
    await act(async () => {
      get().fetchFiles('b/');
    });

    expect(get().filePath).toBe('a/');
    expect(get().fetchedFoldersData[get().filePath]).toEqual([createItem('a/one')]);
    expect(get().fetchedFoldersData['b/']).toEqual([createItem('b/two')]);
  });
});

describe('createFolderContext overlapping requests', () => {
  test('the newest request decides the selected folder, even when an older one settles later', async () => {
    const slow = createDeferred<AssetListItem[]>();
    const getFiles = vi.fn((path: string) => (path === 'a/' ? slow.promise : Promise.resolve([])));
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('a/', false, true);
      get().fetchFiles('b/', false, true);
    });

    expect(get().filePath).toBe('b/');

    await act(async () => {
      slow.resolve([]);
    });

    expect(get().filePath).toBe('b/');
  });

  test('a response that is no longer the newest still fills the cache and the tree', async () => {
    const slow = createDeferred<AssetListItem[]>();
    const getFiles = vi.fn((path: string) => (path === 'a/' ? slow.promise : Promise.resolve([createItem('b/one')])));
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('a/');
      get().fetchFiles('b/');
    });
    await act(async () => {
      slow.resolve([createItem('a/two')]);
    });

    expect(get().fetchedFoldersData['a/']).toEqual([createItem('a/two')]);
    expect(get().fetchedFoldersData['b/']).toEqual([createItem('b/one')]);
  });

  test('isFetchingFiles stays true until the last of two overlapping fetches settles', async () => {
    const slow = createDeferred<AssetListItem[]>();
    const getFiles = vi.fn((path: string) => (path === 'a/' ? slow.promise : Promise.resolve([])));
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('a/');
      get().fetchFiles('b/');
    });

    expect(get().isFetchingFiles).toBe(true);

    await act(async () => {
      slow.resolve([]);
    });

    expect(get().isFetchingFiles).toBe(false);
  });

  test('an older failure does not flag an error after a newer request succeeded', async () => {
    const slow = createDeferred<AssetListItem[] | undefined>();
    const getFiles = vi.fn((path: string) => (path === 'a/' ? slow.promise : Promise.resolve([createItem('b/one')])));
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('a/');
      get().fetchFiles('b/');
    });
    await act(async () => {
      slow.resolve(undefined);
    });

    expect(get().hasFetchError).toBe(false);
    expect(get().fetchedFoldersData['b/']).toEqual([createItem('b/one')]);
  });

  test('a fetch that resolves after the user picked a folder does not take the selection', async () => {
    const slow = createDeferred<AssetListItem[]>();
    const get = renderProviderWithCapture(vi.fn(() => slow.promise));

    act(() => {
      get().fetchFiles('a/');
    });
    act(() => {
      get().setFilePath('chosen/');
    });
    await act(async () => {
      slow.resolve([]);
    });

    expect(get().filePath).toBe('chosen/');
  });
});

describe('createFolderContext when a fetch throws', () => {
  test('flags an error and goes idle when a single-folder fetch rejects', async () => {
    const get = renderProviderWithCapture(vi.fn().mockRejectedValue(new Error('session expired')));

    await act(async () => {
      get().fetchFiles('/folder/');
    });

    expect(get().hasFetchError).toBe(true);
    expect(get().isFetchingFiles).toBe(false);
    expect(get().fetchedFoldersData).toEqual({});
  });

  test('flags an error and goes idle when a multi-root fetch rejects', async () => {
    const get = renderProviderWithCapture(vi.fn().mockRejectedValue(new Error('session expired')));

    await act(async () => {
      get().fetchFiles(['platform/', 'public/']);
    });

    expect(get().hasFetchError).toBe(true);
    expect(get().isFetchingFiles).toBe(false);
    expect(get().files).toEqual([]);
  });

  test('flags an error and goes idle when a hierarchy fetch rejects', async () => {
    const get = renderProviderWithCapture(vi.fn().mockRejectedValue(new Error('session expired')));

    await act(async () => {
      get().fetchFolderHierarchy?.('a/b/');
    });

    expect(get().hasFetchError).toBe(true);
    expect(get().isFetchingFiles).toBe(false);
    expect(get().files).toEqual([]);
  });

  test('clears the error once a later fetch succeeds', async () => {
    const getFiles = vi.fn().mockRejectedValueOnce(new Error('session expired')).mockResolvedValue([]);
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('/folder/');
    });
    await act(async () => {
      get().fetchFiles('/folder/');
    });

    expect(get().hasFetchError).toBe(false);
  });

  test('an older rejection does not flag an error after a newer request succeeded', async () => {
    let rejectSlow: (reason: Error) => void = () => {};
    const slow = new Promise<AssetListItem[]>((_, reject) => {
      rejectSlow = reject;
    });
    const getFiles = vi.fn((path: string) => (path === 'a/' ? slow : Promise.resolve([createItem('b/one')])));
    const get = renderProviderWithCapture(getFiles);

    await act(async () => {
      get().fetchFiles('a/');
      get().fetchFiles('b/');
    });
    await act(async () => {
      rejectSlow(new Error('session expired'));
    });

    expect(get().hasFetchError).toBe(false);
    expect(get().fetchedFoldersData['b/']).toEqual([createItem('b/one')]);
    expect(get().isFetchingFiles).toBe(false);
  });
});

describe('createFolderContext under StrictMode', () => {
  test('opens the first node exactly once on the first load', async () => {
    const { Provider, useFolderContext } = createFolderContext(
      vi.fn().mockResolvedValue([createItem('root/item')]),
      'testFolder',
    );
    let captured: AssetsFolderContext<AssetListItem> | null = null;
    const Capture = () => {
      captured = useFolderContext();
      return null;
    };

    render(
      <StrictMode>
        <Provider>
          <Capture />
        </Provider>
      </StrictMode>,
    );
    await act(async () => {
      captured!.fetchFiles('root/');
    });

    expect([...captured!.expandedFolders]).toEqual(['root/']);
    expect(captured!.filePath).toBe('root/');
  });
});

describe('createFolderContext referential stability', () => {
  test('keeps the handlers and the context value across an unrelated re-render', async () => {
    const { Provider, useFolderContext } = createFolderContext(vi.fn().mockResolvedValue([]), 'testFolder');
    const captured: AssetsFolderContext<AssetListItem>[] = [];
    const Capture = () => {
      captured.push(useFolderContext());
      return null;
    };
    const renderTree = () => (
      <Provider>
        <Capture />
      </Provider>
    );

    const { rerender } = render(renderTree());
    await act(async () => {
      rerender(renderTree());
    });

    const [first, last] = [captured[0], captured.at(-1)!];
    expect(captured.length).toBeGreaterThan(1);
    expect(last).toBe(first);
    expect(last.fetchFiles).toBe(first.fetchFiles);
    expect(last.toggleFolder).toBe(first.toggleFolder);
    expect(last.fetchFolderHierarchy).toBe(first.fetchFolderHierarchy);
    expect(last.setFilePath).toBe(first.setFilePath);
    expect(last.setExpandedFolders).toBe(first.setExpandedFolders);
  });

  test('keeps the handlers when the state changes, so effects that depend on them do not re-run', async () => {
    const getFiles = vi.fn().mockResolvedValue([]);
    const get = renderProviderWithCapture(getFiles);
    const { fetchFiles, toggleFolder, setFilePath } = get();

    await act(async () => {
      get().fetchFiles('a/');
    });

    expect(get().fetchFiles).toBe(fetchFiles);
    expect(get().toggleFolder).toBe(toggleFolder);
    expect(get().setFilePath).toBe(setFilePath);
  });
});
