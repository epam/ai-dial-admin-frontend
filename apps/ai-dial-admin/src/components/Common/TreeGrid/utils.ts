import { TreeRow } from './types';

export interface BuildTreeOptions<T> {
  getId: (r: T) => string;
  getParentId: (r: T) => string | null;
  maxDepth?: number;
}

export function buildTreeFromParentPointer<T>(rows: T[], opts: BuildTreeOptions<T>): TreeRow<T>[] {
  const { getId, getParentId, maxDepth = 8 } = opts;

  const compositeKey = (row: T) => `${getId(row)}:${getParentId(row) ?? ''}`;

  const rowByKey = new Map<string, T>();
  const keysByName = new Map<string, string[]>();

  for (const row of rows) {
    const key = compositeKey(row);
    rowByKey.set(key, row);
    const name = getId(row);
    if (!keysByName.has(name)) keysByName.set(name, []);
    keysByName.get(name)!.push(key);
  }

  const childrenByParentName = new Map<string, string[]>();
  for (const [key, row] of rowByKey) {
    const parentName = getParentId(row);
    if (parentName !== null && keysByName.has(parentName)) {
      if (!childrenByParentName.has(parentName)) childrenByParentName.set(parentName, []);
      childrenByParentName.get(parentName)!.push(key);
    }
  }

  const rootKeys: string[] = [];
  for (const [key, row] of rowByKey) {
    const parentName = getParentId(row);
    if (parentName === null || !keysByName.has(parentName)) {
      rootKeys.push(key);
    }
  }

  const visitedKeys = new Set<string>();
  const depthCapHits: string[] = [];
  let cycleWarned = false;

  const buildNode = (key: string, depth: number, ancestors: Set<string>): TreeRow<T> => {
    visitedKeys.add(key);
    const row = rowByKey.get(key)!;
    const name = getId(row);
    const rawChildKeys = childrenByParentName.get(name) || [];
    const atCap = depth >= maxDepth;

    if (atCap && rawChildKeys.length > 0) {
      depthCapHits.push(key);
    }
    const childKeysToProcess = atCap ? [] : rawChildKeys;

    const filteredChildKeys = childKeysToProcess.filter((childKey) => {
      if (ancestors.has(childKey)) {
        if (!cycleWarned) {
          console.warn(`[TreeGrid] Cycle detected: "${childKey}" is an ancestor. Back-edge dropped.`);
          cycleWarned = true;
        }
        return false;
      }
      return true;
    });

    const newAncestors = new Set([...ancestors, key]);
    const children = filteredChildKeys.map((childKey) => buildNode(childKey, depth + 1, newAncestors));

    return {
      ...row,
      id: key,
      parentId: getParentId(row),
      depth,
      expanded: false,
      children,
    } as TreeRow<T>;
  };

  const result = rootKeys.map((key) => buildNode(key, 0, new Set()));

  const cycleKeys = [...rowByKey.keys()].filter((key) => !visitedKeys.has(key));
  if (cycleKeys.length > 0) {
    console.warn(
      `[TreeGrid] Cycle detected involving: ${cycleKeys.join(', ')}. Treating first unvisited node as root.`,
    );
    for (const key of cycleKeys) {
      if (!visitedKeys.has(key)) {
        result.push(buildNode(key, 0, new Set()));
      }
    }
  }

  if (depthCapHits.length > 0) {
    console.warn(
      `[TreeGrid] Depth cap (${maxDepth}) reached for ${depthCapHits.length} row(s). Further nesting removed.`,
    );
  }

  return result;
}

export function flattenTree<T>(rows: TreeRow<T>[]): TreeRow<T>[] {
  const out: TreeRow<T>[] = [];
  for (const row of rows) {
    out.push(row);
    if (row.expanded && row.children.length > 0) {
      out.push(...flattenTree(row.children));
    }
  }
  return out;
}

export function updateRowInTree<R extends { id: string; children: R[] }>(
  rows: R[],
  id: string,
  updater: (row: R) => R,
): R[] {
  return rows.map((row) => {
    if (row.id === id) return updater(row);
    if (row.children.length > 0) {
      return { ...row, children: updateRowInTree(row.children, id, updater) } as R;
    }
    return row;
  });
}

export function findRowInTree<R extends { id: string; children: R[] }>(rows: R[], id: string): R | undefined {
  for (const row of rows) {
    if (row.id === id) return row;
    const found = findRowInTree(row.children, id);
    if (found) return found;
  }
  return undefined;
}

export function overlayExpandedState<T>(tree: TreeRow<T>[], prev: Map<string, boolean>): TreeRow<T>[] {
  return tree.map((row) => ({
    ...row,
    expanded: prev.has(row.id) ? (prev.get(row.id) as boolean) : row.expanded,
    children: overlayExpandedState(row.children, prev),
  }));
}
