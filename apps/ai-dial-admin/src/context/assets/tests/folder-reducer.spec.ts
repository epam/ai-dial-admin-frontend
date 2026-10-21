import { FolderActionType, FolderState } from '@/src/context/assets/models';
import { AssetListItem, BucketType } from '@/src/models/dial/asset-list-item';
import { DialFile, DialFileNodeType } from '@/src/models/dial/file';
import { describe, expect, test } from 'vitest';
import { createInitialFolderState, folderReducer, toggleFolderState } from '../folder-reducer';

const createItem = (path: string) =>
  ({ name: path.split('/').at(-1), path, nodeType: DialFileNodeType.ITEM, bucket: BucketType.Public }) as AssetListItem;

const createFolder = (path: string) =>
  ({
    name: path.split('/').filter(Boolean).at(-1),
    path,
    nodeType: DialFileNodeType.FOLDER,
    bucket: BucketType.Public,
  }) as AssetListItem;

const createState = (overrides?: Partial<FolderState<AssetListItem>>): FolderState<AssetListItem> => ({
  ...createInitialFolderState<AssetListItem>(),
  ...overrides,
});

const noFailedPaths = new Set<string>();

// Tree nodes carry their children in `items`, which the row type does not declare.
const getChildren = (node?: AssetListItem | DialFile) => (node as DialFile | undefined)?.items;

describe('Folder Reducer :: createInitialFolderState', () => {
  test('Should start empty, with no error', () => {
    expect(createInitialFolderState()).toEqual({
      files: [],
      filePath: '',
      hasFetchError: false,
      expandedFolders: new Set(),
      fetchedFoldersData: {},
    });
  });
});

describe('Folder Reducer :: path and expansion setters', () => {
  test('Should set the file path from a value', () => {
    const next = folderReducer(createState(), { type: FolderActionType.FilePathSet, value: 'a/' });

    expect(next.filePath).toBe('a/');
  });

  test('Should set the file path from an updater that receives the current one', () => {
    const next = folderReducer(createState({ filePath: 'a/' }), {
      type: FolderActionType.FilePathSet,
      value: (previous) => `${previous}b/`,
    });

    expect(next.filePath).toBe('a/b/');
  });

  test('Should set the expanded folders from a value', () => {
    const next = folderReducer(createState(), {
      type: FolderActionType.ExpandedFoldersSet,
      value: new Set(['a/']),
    });

    expect([...next.expandedFolders]).toEqual(['a/']);
  });

  test('Should set the expanded folders from an updater that receives the current set', () => {
    const next = folderReducer(createState({ expandedFolders: new Set(['a/']) }), {
      type: FolderActionType.ExpandedFoldersSet,
      value: (previous) => new Set([...previous, 'b/']),
    });

    expect([...next.expandedFolders]).toEqual(['a/', 'b/']);
  });
});

describe('Folder Reducer :: FetchFailed', () => {
  test('Should flag the failure and keep the rest of the state', () => {
    const state = createState({ filePath: 'a/', files: [createFolder('a/')] });

    const next = folderReducer(state, { type: FolderActionType.FetchFailed });

    expect(next).toEqual({ ...state, hasFetchError: true });
  });
});

describe('Folder Reducer :: HierarchyLoaded', () => {
  test('Should replace the tree, cache, expansion and selection at once, and clear the error', () => {
    const hierarchy = {
      files: [createFolder('a/')],
      fetchedFoldersData: { 'a/': [createItem('a/x')] },
      expandedFolders: new Set(['a/']),
      filePath: 'a/',
    };

    const next = folderReducer(
      createState({ filePath: 'old/', fetchedFoldersData: { 'old/': [] }, hasFetchError: true }),
      { type: FolderActionType.HierarchyLoaded, hierarchy },
    );

    expect(next).toEqual({ ...hierarchy, hasFetchError: false });
  });
});

describe('Folder Reducer :: RootsLoaded', () => {
  const payload = {
    type: FolderActionType.RootsLoaded as const,
    files: [createFolder('platform/'), createFolder('public/')],
    fetchedFoldersData: { 'platform/': [createItem('platform/a')], 'public/': [createItem('public/b')] },
    openPath: 'public/',
    isLatestRequest: true,
  };

  test('Should show the open root and select it', () => {
    const next = folderReducer(createState(), payload);

    expect(next.files).toBe(payload.files);
    expect(next.filePath).toBe('public/');
    expect([...next.expandedFolders]).toEqual(['public/']);
  });

  test('Should merge into the cached folders and keep the open ones by default', () => {
    const next = folderReducer(
      createState({ fetchedFoldersData: { 'other/': [] }, expandedFolders: new Set(['other/']) }),
      payload,
    );

    expect(Object.keys(next.fetchedFoldersData)).toEqual(['other/', 'platform/', 'public/']);
    expect([...next.expandedFolders]).toEqual(['other/', 'public/']);
  });

  test('Should replace the cache and open only the root when refreshing', () => {
    const next = folderReducer(
      createState({ fetchedFoldersData: { 'other/': [] }, expandedFolders: new Set(['other/']) }),
      { ...payload, refreshData: true },
    );

    expect(Object.keys(next.fetchedFoldersData)).toEqual(['platform/', 'public/']);
    expect([...next.expandedFolders]).toEqual(['public/']);
  });

  test('Should clear a previous error', () => {
    const next = folderReducer(createState({ hasFetchError: true }), payload);

    expect(next.hasFetchError).toBe(false);
  });

  test('Should keep the current selection by default', () => {
    const next = folderReducer(createState({ filePath: 'platform/' }), payload);

    expect(next.filePath).toBe('platform/');
  });

  test('Should select the open root over the current selection when resetFolder is set', () => {
    const next = folderReducer(createState({ filePath: 'platform/' }), { ...payload, resetFolder: true });

    expect(next.filePath).toBe('public/');
  });

  test('Should only add to the cache when a newer request has started', () => {
    const state = createState({
      files: [createFolder('current/')],
      filePath: 'current/',
      hasFetchError: true,
      expandedFolders: new Set(['current/']),
      fetchedFoldersData: { 'current/': [createItem('current/x')] },
    });

    const next = folderReducer(state, { ...payload, isLatestRequest: false, refreshData: true });

    expect(next).toEqual({
      ...state,
      fetchedFoldersData: { ...state.fetchedFoldersData, ...payload.fetchedFoldersData },
    });
  });
});

describe('Folder Reducer :: FolderLoaded', () => {
  const items = [createItem('root/item')];
  const payload = {
    type: FolderActionType.FolderLoaded as const,
    path: 'root/',
    fetched: [createFolder('root/sub/'), ...items],
    folderItems: items,
    isLatestRequest: true,
  };

  test('Should build the first root node, open it and select it on the first load', () => {
    const next = folderReducer(createState(), payload);

    expect(next.files).toHaveLength(1);
    expect(next.files[0].path).toBe('root/');
    expect([...next.expandedFolders]).toEqual(['root/']);
    expect(next.filePath).toBe('root/');
    expect(next.fetchedFoldersData).toEqual({ 'root/': items });
  });

  test('Should merge a later load into the tree without opening or selecting anything else', () => {
    const state = folderReducer(createState(), payload);

    const next = folderReducer(state, {
      ...payload,
      path: 'root/sub/',
      fetched: [createItem('root/sub/leaf')],
      folderItems: [createItem('root/sub/leaf')],
    });

    expect([...next.expandedFolders]).toEqual(['root/']);
    expect(next.filePath).toBe('root/');
    expect(Object.keys(next.fetchedFoldersData)).toEqual(['root/', 'root/sub/']);
  });

  test('Should select the loaded folder on a later load when told to', () => {
    const state = folderReducer(createState(), payload);

    const next = folderReducer(state, {
      ...payload,
      path: 'root/sub/',
      fetched: [],
      folderItems: [],
      resetFolder: true,
    });

    expect(next.filePath).toBe('root/sub/');
  });

  test('Should replace the cache and land on the first node when refreshing', () => {
    const state = createState({
      files: [createFolder('root/')],
      expandedFolders: new Set(['root/', 'root/sub/']),
      fetchedFoldersData: { 'root/': [], 'root/sub/': [] },
      filePath: 'root/sub/',
    });

    const next = folderReducer(state, { ...payload, refreshData: true });

    expect(Object.keys(next.fetchedFoldersData)).toEqual(['root/']);
    expect([...next.expandedFolders]).toEqual(['root/']);
    expect(next.filePath).toBe('root/');
  });

  test('Should clear a previous error on a load that is the newest request, and keep it otherwise', () => {
    const state = createState({ hasFetchError: true });

    expect(folderReducer(state, payload).hasFetchError).toBe(false);
    expect(folderReducer(state, { ...payload, isLatestRequest: false }).hasFetchError).toBe(true);
  });

  test('Should keep the selection decided against the current state, not the one the fetch started from', () => {
    const state = folderReducer(createState(), payload);
    const selected = folderReducer(state, { type: FolderActionType.FilePathSet, value: 'chosen/' });

    const next = folderReducer(selected, { ...payload, path: 'root/sub/', fetched: [], folderItems: [] });

    expect(next.filePath).toBe('chosen/');
  });

  test('Should only fill the cache and the tree when a newer request has started', () => {
    const state = folderReducer(createState(), payload);

    const next = folderReducer(state, {
      ...payload,
      path: 'root/sub/',
      fetched: [createItem('root/sub/leaf')],
      folderItems: [createItem('root/sub/leaf')],
      isLatestRequest: false,
      resetFolder: true,
    });

    expect(next.fetchedFoldersData['root/sub/']).toEqual([createItem('root/sub/leaf')]);
    expect(getChildren(getChildren(next.files[0])?.find((child) => child.path === 'root/sub/'))).toHaveLength(1);
    expect(next.filePath).toBe('root/');
  });

  test('Should merge instead of replacing the cache when a refresh is no longer the newest request', () => {
    const state = folderReducer(createState(), payload);

    const next = folderReducer(state, { ...payload, refreshData: true, isLatestRequest: false });

    expect(next.expandedFolders).toEqual(state.expandedFolders);
    expect(Object.keys(next.fetchedFoldersData)).toEqual(['root/']);
  });

  test('Should still build the first node when the first response to arrive is not the newest request', () => {
    const next = folderReducer(createState(), { ...payload, isLatestRequest: false });

    expect(next.files[0].path).toBe('root/');
    expect([...next.expandedFolders]).toEqual(['root/']);
  });

  test('Should decide the first-load expansion from the state it receives, so replaying it is harmless', () => {
    const first = folderReducer(createState(), payload);
    const replayed = folderReducer(createState(), payload);

    expect(replayed).toEqual(first);
  });

  test('Should not mutate the state it receives', () => {
    const state = createState({ expandedFolders: new Set(['a/']) });

    folderReducer(state, payload);

    expect(state).toEqual(createState({ expandedFolders: new Set(['a/']) }));
  });
});

describe('Folder Reducer :: toggleFolderState', () => {
  const cached = [createItem('a/x')];
  const state = createState({
    expandedFolders: new Set(['open/']),
    fetchedFoldersData: { 'a/': cached, 'open/': [createItem('open/y')] },
  });

  test('Should open a cached folder and select it', () => {
    const { state: next, shouldFetch } = toggleFolderState(state, 'a/', { failedPaths: noFailedPaths });

    expect(shouldFetch).toBe(false);
    expect(next.filePath).toBe('a/');
    expect([...next.expandedFolders]).toEqual(['open/', 'a/']);
  });

  test('Should ask for a fetch when the folder is not cached', () => {
    const { state: next, shouldFetch } = toggleFolderState(state, 'new/', { failedPaths: noFailedPaths });

    expect(shouldFetch).toBe(true);
    expect(next.hasFetchError).toBe(false);
    expect(next.expandedFolders.has('new/')).toBe(true);
  });

  test('Should not ask for a fetch when skipFetch is set', () => {
    const { state: next, shouldFetch } = toggleFolderState(state, 'new/', {
      skipFetch: true,
      failedPaths: noFailedPaths,
    });

    expect(shouldFetch).toBe(false);
    expect(next.filePath).toBe('new/');
  });

  test('Should close an open folder and select it', () => {
    const { state: next } = toggleFolderState(state, 'open/', { failedPaths: noFailedPaths });

    expect(next.expandedFolders.has('open/')).toBe(false);
    expect(next.filePath).toBe('open/');
  });

  test('Should drop every other open folder when collapseAll is set', () => {
    const { state: next } = toggleFolderState(state, 'a/', { collapseAll: true, failedPaths: noFailedPaths });

    expect([...next.expandedFolders]).toEqual(['a/']);
  });

  test('Should flag an error, and not ask for a fetch, for a folder that failed to load', () => {
    const { state: next, shouldFetch } = toggleFolderState(state, 'a/', { failedPaths: new Set(['a/']) });

    expect(shouldFetch).toBe(false);
    expect(next.hasFetchError).toBe(true);
  });

  test('Should clear an error left by the previously selected folder', () => {
    const { state: next } = toggleFolderState({ ...state, hasFetchError: true }, 'a/', {
      failedPaths: noFailedPaths,
    });

    expect(next.hasFetchError).toBe(false);
  });

  test('Should not mutate the state it receives', () => {
    toggleFolderState(state, 'a/', { failedPaths: noFailedPaths });

    expect([...state.expandedFolders]).toEqual(['open/']);
    expect(state.filePath).toBe('');
  });
});

describe('Folder Reducer :: FolderToggled', () => {
  test('Should apply the same transition as toggleFolderState', () => {
    const state = createState({ fetchedFoldersData: { 'a/': [createItem('a/x')] } });
    const options = { failedPaths: noFailedPaths };

    const next = folderReducer(state, { type: FolderActionType.FolderToggled, folderPath: 'a/', options });

    expect(next).toEqual(toggleFolderState(state, 'a/', options).state);
  });
});
