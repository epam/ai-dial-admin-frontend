import { decodeCorePath, ensureTrailingSlash, stripPrefix, stripTrailingSlash } from '@/src/server/publications/path';
import { WalkableNode, isFolderNode } from './resource-walk';

export interface FolderNode {
  name: string;
  path: string;
  folderId: string;
  nodeType: 'folder';
  parentPath?: string | null;
  bucket?: string;
  items?: FolderNode[];
}

interface MetadataNodeWithBucket extends WalkableNode {
  name?: string;
  parentPath?: string | null;
  bucket?: string;
}

interface FlatFolderEntry {
  name: string;
  path: string;
  folderId: string;
  parentPath?: string | null;
  bucket?: string;
}

/**
 * Splits a trailing-slashed folder path into `{path, folderId, name}`. Unlike the shared
 * `parsePath` (which throws when a path has no `/`), a root-bucket folder like `"public/"`
 * is a real, valid folder with no parent segment — handled here rather than in the shared
 * helper, which other callers rely on to reject that shape.
 */
const parseFolderPath = (trailingSlashedPath: string): { path: string; folderId: string; name: string } => {
  const trimmed = stripTrailingSlash(trailingSlashedPath);
  const lastSlashIndex = trimmed.lastIndexOf('/');
  if (lastSlashIndex === -1) {
    return { path: trailingSlashedPath, folderId: '', name: trimmed };
  }
  return {
    path: trailingSlashedPath,
    folderId: `${trimmed.slice(0, lastSlashIndex)}/`,
    name: trimmed.slice(lastSlashIndex + 1),
  };
};

const toFlatFolderEntry = (node: MetadataNodeWithBucket, prefix: string): FlatFolderEntry => {
  const decoded = ensureTrailingSlash(decodeCorePath(stripPrefix(node.url || '', prefix)));
  const { path, folderId, name } = parseFolderPath(decoded);
  return { name, path, folderId, parentPath: node.parentPath, bucket: node.bucket };
};

/**
 * Builds a nested `FolderNode` tree from a Core metadata read, which returns every descendant
 * FOLDER entry as a **flat list** directly on the queried node's `items[]]` when `recursive`
 * is set (confirmed live against a real Core instance — not nested inside each FOLDER
 * child's own `items`, which Core leaves empty/absent at any depth below the root).
 * Reconstructs the hierarchy by grouping flat entries on their own `folderId` (their parent's
 * path) rather than assuming the wire shape is already a tree. For a non-recursive read
 * (one level — see `folders-core.ts`'s `readFolderMetadata`) this degenerates naturally to a
 * single level, since there are no deeper entries to group.
 */
export const toFolderTree = (node: MetadataNodeWithBucket, prefix: string): FolderNode => {
  const rootEntry = toFlatFolderEntry(node, prefix);
  const flatFolders = (node.items || [])
    .filter(isFolderNode)
    .map((item) => toFlatFolderEntry(item as MetadataNodeWithBucket, prefix));

  const childrenByFolderId = new Map<string, FlatFolderEntry[]>();
  for (const entry of flatFolders) {
    const siblings = childrenByFolderId.get(entry.folderId) || [];
    siblings.push(entry);
    childrenByFolderId.set(entry.folderId, siblings);
  }

  const buildNode = (entry: FlatFolderEntry): FolderNode => ({
    name: entry.name,
    path: entry.path,
    folderId: entry.folderId,
    nodeType: 'folder',
    parentPath: entry.parentPath ?? null,
    bucket: entry.bucket,
    items: (childrenByFolderId.get(entry.path) || []).map(buildNode),
  });

  return buildNode(rootEntry);
};

/**
 * Merges the same folder's tree as seen by multiple resource types into one, ported from the
 * backend's `FolderService.merge`/`validateFolderInfoConsistency`. Throws if two types disagree
 * on name/parentPath/bucket/path for what should be the same folder (design D4) — a real
 * data-inconsistency is surfaced loudly, not silently resolved.
 */
export const mergeFolderTrees = (trees: (FolderNode | null | undefined)[]): FolderNode | null => {
  const present = trees.filter((tree): tree is FolderNode => Boolean(tree));
  if (present.length === 0) {
    return null;
  }

  const [first, ...rest] = present;
  for (const other of rest) {
    if (
      other.name !== first.name ||
      other.parentPath !== first.parentPath ||
      other.bucket !== first.bucket ||
      other.path !== first.path
    ) {
      throw new Error(`Inconsistent folder metadata across resource types for path "${first.path}"`);
    }
  }

  return {
    ...first,
    items: mergeChildLists(present.map((tree) => tree.items || [])),
  };
};

const mergeChildLists = (lists: FolderNode[][]): FolderNode[] => {
  const byName = new Map<string, FolderNode[]>();
  for (const list of lists) {
    for (const item of list) {
      byName.set(item.name, [...(byName.get(item.name) || []), item]);
    }
  }
  return Array.from(byName.values()).map((group) => mergeFolderTrees(group) as FolderNode);
};
