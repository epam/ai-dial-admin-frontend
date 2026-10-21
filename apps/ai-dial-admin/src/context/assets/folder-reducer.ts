import { SetStateAction } from 'react';

import {
  FolderAction,
  FolderActionType,
  FolderState,
  ToggleFolderOptions,
  ToggleFolderResult,
} from '@/src/context/assets/models';
import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { mergeFiles } from '@/src/utils/files/folder';

export const createInitialFolderState = <T extends AssetListItem>(): FolderState<T> => ({
  files: [],
  filePath: '',
  hasFetchError: false,
  expandedFolders: new Set(),
  fetchedFoldersData: {},
});

const resolveStateAction = <S>(action: SetStateAction<S>, previous: S): S =>
  typeof action === 'function' ? (action as (previous: S) => S)(previous) : action;

/**
 * Opens or closes `folderPath` and selects it. Opening a folder that has no cached items sets
 * `shouldFetch`, because loading them is the caller's side effect.
 */
export const toggleFolderState = <T extends AssetListItem>(
  state: FolderState<T>,
  folderPath: string,
  { skipFetch, collapseAll, failedPaths }: ToggleFolderOptions,
): ToggleFolderResult<T> => {
  const expandedFolders = new Set(collapseAll ? [] : state.expandedFolders);
  const isCached = state.fetchedFoldersData[folderPath] != null;
  let hasFetchError = false;
  let shouldFetch = false;

  if (expandedFolders.has(folderPath)) {
    expandedFolders.delete(folderPath);
  } else {
    expandedFolders.add(folderPath);
    hasFetchError = failedPaths.has(folderPath);
    shouldFetch = !hasFetchError && !isCached && !skipFetch;
  }

  return { state: { ...state, filePath: folderPath, expandedFolders, hasFetchError }, shouldFetch };
};

export const folderReducer = <T extends AssetListItem>(
  state: FolderState<T>,
  action: FolderAction<T>,
): FolderState<T> => {
  switch (action.type) {
    case FolderActionType.FilePathSet:
      return { ...state, filePath: resolveStateAction(action.value, state.filePath) };

    case FolderActionType.ExpandedFoldersSet:
      return { ...state, expandedFolders: resolveStateAction(action.value, state.expandedFolders) };

    case FolderActionType.FetchFailed:
      return { ...state, hasFetchError: true };

    case FolderActionType.HierarchyLoaded: {
      const { files, fetchedFoldersData, expandedFolders, filePath } = action.hierarchy;
      return { files, fetchedFoldersData, expandedFolders, filePath, hasFetchError: false };
    }

    case FolderActionType.RootsLoaded: {
      const shouldReplaceCache = action.refreshData && action.isLatestRequest;
      const fetchedFoldersData = shouldReplaceCache
        ? action.fetchedFoldersData
        : { ...state.fetchedFoldersData, ...action.fetchedFoldersData };

      if (!action.isLatestRequest) {
        return { ...state, fetchedFoldersData };
      }

      return {
        files: action.files,
        fetchedFoldersData,
        hasFetchError: false,
        expandedFolders: new Set(action.refreshData ? [action.openPath] : [...state.expandedFolders, action.openPath]),
        filePath: !state.filePath || action.resetFolder ? action.openPath : state.filePath,
      };
    }

    case FolderActionType.FolderLoaded: {
      const files = mergeFiles<T>(state.files, action.fetched, action.path);
      const shouldReplaceCache = action.refreshData && action.isLatestRequest;
      const fetchedFoldersData = shouldReplaceCache
        ? { [action.path]: action.folderItems }
        : { ...state.fetchedFoldersData, [action.path]: action.folderItems };

      let next: FolderState<T> = { ...state, files, fetchedFoldersData };
      if (action.isLatestRequest) {
        next = {
          ...next,
          hasFetchError: false,
          filePath: !state.filePath || action.resetFolder ? action.path : state.filePath,
        };
      }

      // The first load opens the tree's first node. A refresh also selects it and leaves it as the only
      // folder open; a first load keeps whatever the user selected while the fetch was running.
      const isFirstLoad = state.files.length === 0;
      if (!isFirstLoad && !shouldReplaceCache) {
        return next;
      }

      const { state: toggled } = toggleFolderState(next, files[0].path, {
        skipFetch: true,
        collapseAll: action.refreshData,
        failedPaths: new Set(),
      });
      return {
        ...next,
        filePath: shouldReplaceCache ? toggled.filePath : next.filePath,
        expandedFolders: toggled.expandedFolders,
      };
    }

    case FolderActionType.FolderToggled:
      return toggleFolderState(state, action.folderPath, action.options).state;
  }
};
