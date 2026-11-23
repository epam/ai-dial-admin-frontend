import { AssetListItem, BucketType, EntitySource } from '@/src/models/dial/asset-list-item';
import { DialFileNodeType } from '@/src/models/dial/file';

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
