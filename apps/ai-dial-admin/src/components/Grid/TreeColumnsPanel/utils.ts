import { ColDef } from 'ag-grid-community';

const setHideRecursive = (node: ColDef, hide: boolean): ColDef => {
  const children = 'children' in node && node.children ? (node.children as ColDef[]) : [];
  if (children.length > 0) {
    return { ...node, hide, children: children.map((child) => setHideRecursive(child, hide)) } as ColDef;
  }
  return { ...node, hide };
};

export const toggleColDefNode = (tree: ColDef[], path: number[], hide: boolean): ColDef[] => {
  if (path.length === 0) return tree;
  return tree.map((node, i) => {
    if (i !== path[0]) return node;
    if (path.length === 1) return setHideRecursive(node, hide);
    const children = 'children' in node && node.children ? (node.children as ColDef[]) : [];
    return { ...node, children: toggleColDefNode(children, path.slice(1), hide) };
  });
};

export const collectLeafStates = (node: ColDef, skipLeafNames: string[]): boolean[] => {
  const children = 'children' in node && node.children ? (node.children as ColDef[]) : [];
  if (children.length > 0) {
    return children.flatMap((child) => collectLeafStates(child, skipLeafNames));
  }
  if (node.headerName && skipLeafNames.includes(node.headerName)) return [];
  return [node.hide !== true];
};

export const getGroupCheckState = (
  node: ColDef,
  skipLeafNames: string[],
): 'checked' | 'unchecked' | 'indeterminate' => {
  const states = collectLeafStates(node, skipLeafNames);
  if (states.length === 0) return 'checked';
  if (states.every(Boolean)) return 'checked';
  if (states.every((v) => !v)) return 'unchecked';
  return 'indeterminate';
};
