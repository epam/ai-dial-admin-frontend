import { DEFAULT_ROOT_FOLDER_PERMISSIONS } from '@/src/constants/file';
import { AssetListItem, BucketType, EntitySource } from '@/src/models/dial/asset-list-item';
import { DialFileNodeType } from '@/src/models/dial/file';
import { fillChildren, getFolderName } from '@/src/utils/files/folder';
import { isFileRootPath } from '@/src/utils/files/root-folder';

/**
 * Folder nodes are synthesized client-side and carry only the fields a tree needs, not a full row
 * (`bucket`, `etag`, …), so this is the one place that vouches for them as `T`.
 */
export const createFolderNode = <T extends AssetListItem>(node: object): T =>
  ({ ...node, nodeType: DialFileNodeType.FOLDER }) as unknown as T;

export const toConfigFileItems = (names: string[]): AssetListItem[] =>
  names.map((name) => ({
    name,
    path: name,
    nodeType: DialFileNodeType.ITEM,
    bucket: BucketType.Platform,
    entitySource: EntitySource.File,
  }));

/**
 * One top-level node per root path, in the given order. Root-level nodes are synthesized client-side
 * (Core never returns a permissions-bearing node for a bucket root), so the placeholder permission
 * set has one named source rather than a bare array repeated at each call site — see
 * `DEFAULT_ROOT_FOLDER_PERMISSIONS`'s own comment for why it's not yet read from a real backend
 * permission.
 */
export const buildRootNodes = <T extends AssetListItem>(paths: string[], results: (T[] | null | undefined)[]): T[] =>
  paths.map((rootPath, index) =>
    createFolderNode<T>({
      name: getFolderName(rootPath),
      path: rootPath,
      permissions: DEFAULT_ROOT_FOLDER_PERMISSIONS,
      entitySource: isFileRootPath(rootPath) ? EntitySource.File : EntitySource.Resource,
      items: fillChildren(results[index] ?? []),
    }),
  );
