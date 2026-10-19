import { AssetListItem } from '@/src/models/dial/asset-list-item';
import { getFolderItems, mergeFiles } from '@/src/utils/files/folder';
import { createFolderNode } from '@/src/utils/files/folder-nodes';
import { FolderHierarchy, LoadFolderHierarchyParams } from '@/src/utils/files/models';
import { isFolder } from '@/src/utils/files/path';

/**
 * Walks `fullPath` one folder at a time and returns the tree down to it, the items of every level and
 * the folders to expand, or `null` as soon as one level cannot be loaded.
 *
 * With `fullTree` each level keeps all its entries; otherwise only the branch leading to the next
 * segment is kept.
 */
export const loadFolderHierarchy = async <T extends AssetListItem>({
  fullPath,
  fullTree,
  fetchByPath,
}: LoadFolderHierarchyParams<T>): Promise<FolderHierarchy<T> | null> => {
  const pathParts = fullPath.split('/').filter(Boolean);
  const fetchedFoldersData: Record<string, T[]> = {};
  const expandedFolders = new Set<string>();
  let files: T[] = [];
  let currentPath = '';

  const addPlaceholderFolder = (name: string, path: string) => {
    files = mergeFiles<T>(files, [createFolderNode<T>({ items: [], name, path })], currentPath);
  };

  for (let index = 0; index < pathParts.length; index++) {
    currentPath += pathParts[index] + '/';
    expandedFolders.add(currentPath);

    const nextFolderPath = pathParts[index + 1] ? currentPath + pathParts[index + 1] + '/' : undefined;
    const fetched = await fetchByPath(currentPath);

    if (fetched === undefined) {
      return null;
    }

    const list = fetched ?? [];
    fetchedFoldersData[currentPath] = getFolderItems(list);

    if (list.length) {
      const nextFolder = list.find((file) => file.path === nextFolderPath && isFolder(file.nodeType));
      if (nextFolder && !fullTree) {
        files = mergeFiles<T>(files, [createFolderNode<T>({ ...nextFolder })], currentPath);
      } else if (fullTree) {
        files = mergeFiles<T>(files, list, currentPath);
      } else if (nextFolderPath) {
        // Named after the current segment, not the next one: kept as the code has always behaved.
        addPlaceholderFolder(pathParts[index], nextFolderPath);
      }
    } else if (nextFolderPath) {
      addPlaceholderFolder(pathParts[index + 1], nextFolderPath);
    }
  }

  return {
    files,
    fetchedFoldersData,
    expandedFolders,
    filePath: currentPath,
  };
};
