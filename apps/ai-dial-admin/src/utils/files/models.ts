import { AssetListItem } from '@/src/models/dial/asset-list-item';

export interface FolderHierarchy<T extends AssetListItem> {
  files: T[];
  fetchedFoldersData: Record<string, T[]>;
  expandedFolders: Set<string>;
  filePath: string;
}

export interface LoadFolderHierarchyParams<T extends AssetListItem> {
  fullPath: string;
  fullTree?: boolean;
  /** Resolves to `undefined` when the level could not be loaded, which aborts the whole walk. */
  fetchByPath: (path: string) => Promise<T[] | null | undefined>;
}
