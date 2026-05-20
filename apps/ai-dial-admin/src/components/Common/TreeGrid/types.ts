export type TreeRow<T> = T & {
  id: string;
  parentId: string | null;
  depth: number;
  expanded: boolean;
  children: TreeRow<T>[];
  synthetic?: boolean;
};
