import { DialFile, DialFileNodeType } from '@/src/models/dial/file';
import { getPathFromUrl } from '@/src/utils/files/path';

/**
 * Flattens a file metadata node's `items` into list rows, deriving each row's `path`
 * from its `url` (strips the `files/` prefix and URL-decodes). Mirrors
 * `toResourceInfoList` for versioned assets, but files carry a ready-made `url`
 * rather than an encoded versioned path.
 */
export const toFileList = (node: DialFile | null): DialFile[] => {
  if (!node?.items) {
    return [];
  }
  return node.items.map((item) => ({
    ...item,
    path: getPathFromUrl(item.url),
    nodeType: item.nodeType.toLowerCase() as DialFileNodeType,
  }));
};
