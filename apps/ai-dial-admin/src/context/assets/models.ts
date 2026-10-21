import { SetStateAction } from 'react';

import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { FolderHierarchy } from '@/src/utils/files/models';

export interface FolderState<T extends AssetListItem> {
  files: T[];
  filePath: string;
  /** The most recent fetch for the selected folder failed; cleared by the next successful fetch or toggle. */
  hasFetchError: boolean;
  expandedFolders: Set<string>;
  fetchedFoldersData: Record<string, T[]>;
}

export interface ToggleFolderOptions {
  skipFetch?: boolean;
  collapseAll?: boolean;
  /** Config-file roots whose names failed to load; they are never fetched again by a toggle. */
  failedPaths: ReadonlySet<string>;
}

export interface ToggleFolderResult<T extends AssetListItem> {
  state: FolderState<T>;
  /** The folder was opened without cached items, so the caller still has to fetch them. */
  shouldFetch: boolean;
}

export enum FolderActionType {
  FilePathSet = 'filePathSet',
  ExpandedFoldersSet = 'expandedFoldersSet',
  FetchFailed = 'fetchFailed',
  HierarchyLoaded = 'hierarchyLoaded',
  RootsLoaded = 'rootsLoaded',
  FolderLoaded = 'folderLoaded',
  FolderToggled = 'folderToggled',
}

/**
 * `isLatestRequest` is false when a newer fetch has been started since this one began. The response
 * still fills the cache, which is keyed by path and so independent of arrival order, but it must not
 * change what the user is looking at.
 */
interface RequestOutcome {
  isLatestRequest: boolean;
  refreshData?: boolean;
  /** Select the loaded folder even if one is already selected. */
  resetFolder?: boolean;
}

export interface RootsLoadedPayload<T extends AssetListItem> extends RequestOutcome {
  files: T[];
  fetchedFoldersData: Record<string, T[]>;
  openPath: string;
}

export interface FolderLoadedPayload<T extends AssetListItem> extends RequestOutcome {
  path: string;
  fetched: T[];
  folderItems: T[];
}

export type FolderAction<T extends AssetListItem> =
  | { type: FolderActionType.FilePathSet; value: SetStateAction<string> }
  | { type: FolderActionType.ExpandedFoldersSet; value: SetStateAction<Set<string>> }
  | { type: FolderActionType.FetchFailed }
  | { type: FolderActionType.HierarchyLoaded; hierarchy: FolderHierarchy<T> }
  | ({ type: FolderActionType.RootsLoaded } & RootsLoadedPayload<T>)
  | ({ type: FolderActionType.FolderLoaded } & FolderLoadedPayload<T>)
  | { type: FolderActionType.FolderToggled; folderPath: string; options: ToggleFolderOptions };
