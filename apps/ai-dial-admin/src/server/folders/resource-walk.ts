/**
 * Ports the backend's `ResourceService.getResourceUrls` default method — with a real-Core
 * correction the backend's own implementation lacks (confirmed live, not a backend-parity
 * choice): a `recursive=true` metadata read returns every descendant (ITEM and FOLDER type,
 * at any depth) as a **flat list** directly on the queried node's `items[]`, not nested
 * inside each FOLDER child's own `items` — and that flat list is itself paginated via
 * `nextToken`, which the backend's `getResourceUrls` never follows either (verified against
 * `ResourceService.java`/`PromptService.java` — single call, no loop). Both gaps are fixed
 * here: `fetchAllPages` accumulates every page into one flat `items[]` before any FOLDER/ITEM
 * filtering happens, and `flattenResourceUrls` reads that flat list directly instead of
 * recursing into (empty, in a flat response) child `items`.
 *
 * The five per-type Core clients have differing recursive-metadata-read signatures
 * (`AssetApi.getMetadata` takes an options object; `FilesCoreApi.getFileMetadata` takes
 * positional args) and differing `nodeType` casing conventions observed in this codebase
 * (`'ITEM'/'FOLDER'` for the four versioned types vs. `DialFileNodeType`'s lowercase
 * `'item'/'folder'`) — this walker takes a normalized callback per call site (see
 * `folders-core.ts`) and compares `nodeType` case-insensitively.
 */

export interface WalkableNode {
  nodeType?: string;
  url?: string;
  items?: WalkableNode[];
  nextToken?: string;
}

export const isFolderNode = (node: WalkableNode): boolean => node.nodeType?.toUpperCase() === 'FOLDER';
export const isItemNode = (node: WalkableNode): boolean => node.nodeType?.toUpperCase() === 'ITEM';

/**
 * Fetches every page of a `recursive=true` metadata read, following `nextToken` until
 * exhausted, and returns one node whose `items[]` is the full accumulated flat list.
 */
export const fetchAllPages = async (
  readPage: (nextToken?: string) => Promise<WalkableNode | null>,
): Promise<WalkableNode | null> => {
  const first = await readPage();
  if (!first) {
    return null;
  }

  const items = [...(first.items || [])];
  let nextToken = first.nextToken;
  while (nextToken) {
    const page = await readPage(nextToken);
    if (!page) {
      break;
    }
    items.push(...(page.items || []));
    nextToken = page.nextToken;
  }

  return { ...first, items, nextToken: undefined };
};

/** Reads every ITEM node's URL out of an already-fully-paginated flat metadata node. */
export const flattenResourceUrls = (node: WalkableNode | null | undefined): string[] => {
  if (!node?.items) {
    return [];
  }
  return node.items.filter((item) => isItemNode(item) && item.url).map((item) => item.url as string);
};

/**
 * Reads every page of a resource type's recursive metadata for `path` and flattens it into a
 * list of resource URLs. Swallows read failures (e.g. not-found) into an empty result,
 * matching the backend's behavior — a folder that doesn't exist for a given type simply
 * contributes no URLs.
 */
export const gatherResourceUrls = async (
  readRecursive: (path: string, nextToken?: string) => Promise<WalkableNode | null>,
  path: string,
): Promise<string[]> => {
  try {
    const node = await fetchAllPages((nextToken) => readRecursive(path, nextToken));
    return flattenResourceUrls(node);
  } catch {
    return [];
  }
};
