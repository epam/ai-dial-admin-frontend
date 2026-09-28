import { DialFile, DialFileNodeType } from '@/src/models/dial/file';
import { ensureTrailingSlash } from '@/src/server/publications/path';
import { getPathFromUrl } from '@/src/utils/files/path';

/**
 * A root-level item's `parentPath` comes back `null` from Core — its containing folder is the
 * bucket itself. A nested item's `parentPath` is already bucket-qualified (e.g. `public/folder1/`),
 * unlike every other resource type's metadata node, which needs the generic mapper's `url`-parsing
 * (`asset-metadata.ts`) to recover a bucket-qualified `folderId` — files report it directly.
 */
const toFileFolderId = (item: DialFile): string =>
  item.parentPath ? ensureTrailingSlash(item.parentPath) : ensureTrailingSlash(item.bucket);

/**
 * Flattens a file metadata node's `items` into list rows, deriving each row's `path`
 * from its `url` (strips the `files/` prefix and URL-decodes) and its `folderId` from
 * `parentPath`/`bucket`. Mirrors `toResourceInfoList` for versioned assets, but files carry a
 * ready-made `url` rather than an encoded versioned path.
 */
export const toFileList = (node: DialFile | null): DialFile[] => {
  if (!node?.items) {
    return [];
  }
  return node.items.map((item) => ({
    ...item,
    path: getPathFromUrl(item.url),
    nodeType: item.nodeType?.toLowerCase() as DialFileNodeType,
    folderId: toFileFolderId(item),
  }));
};
